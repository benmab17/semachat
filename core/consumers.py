from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings
from django.core.cache import cache

from .crypto import encrypt_message_content
from .models import ChatRoom, NeighborhoodChatMessage
from .realtime import device_group, map_group, room_group
from .serializers import ChatRoomSerializer, NeighborhoodChatMessageSerializer, NeighborhoodChatPayloadSerializer


class SemaRealtimeConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.joined_groups = set()
        query = parse_qs(self.scope.get("query_string", b"").decode("utf-8", "ignore"))
        self.device_hash = (query.get("device_hash", [""])[0] or "").strip()
        self.room_key = (query.get("room_key", [""])[0] or "").strip().lower()

        await self.accept()
        await self._join_group(map_group())
        if self.device_hash:
            await self._join_group(device_group(self.device_hash))
        if self.room_key:
            await self._join_group(room_group(self.room_key))

    async def disconnect(self, close_code):
        for group_name in list(self.joined_groups):
            await self.channel_layer.group_discard(group_name, self.channel_name)
        self.joined_groups.clear()

    async def receive_json(self, content, **kwargs):
        action = str(content.get("action") or "").strip().lower()
        if action == "subscribe_room":
            next_room = str(content.get("room_key") or "").strip().lower()
            if self.room_key:
                await self._leave_group(room_group(self.room_key))
            self.room_key = next_room
            if self.room_key:
                await self._join_group(room_group(self.room_key))
            await self.send_json({"type": "room.subscribed", "room_key": self.room_key})
            return
        if action == "send_room_message":
            payload = await self._create_room_message(content)
            if payload.get("error"):
                await self.send_json({"type": "room.error", "payload": payload})
                return
            await self.channel_layer.group_send(
                room_group(payload["room"]["slug"]),
                {
                    "type": "semachat.event",
                    "event_type": "social.room_message",
                    "payload": {"message": payload["message"]},
                },
            )
            await self.send_json({"type": "room.sent", "payload": payload})

    async def semachat_event(self, event):
        await self.send_json(
            {
                "type": event.get("event_type") or "unknown",
                "payload": event.get("payload") or {},
            }
        )

    async def _join_group(self, group_name):
        if not group_name or group_name in self.joined_groups:
            return
        await self.channel_layer.group_add(group_name, self.channel_name)
        self.joined_groups.add(group_name)

    async def _leave_group(self, group_name):
        if not group_name or group_name not in self.joined_groups:
            return
        await self.channel_layer.group_discard(group_name, self.channel_name)
        self.joined_groups.discard(group_name)

    @database_sync_to_async
    def _create_room_message(self, content):
        sender_hash = str(content.get("sender_hash") or "").strip()
        if sender_hash and not self._check_room_message_quota(sender_hash):
            return {"error": "Trop de messages envoyés en peu de temps. Réessaie dans un instant."}
        serializer = NeighborhoodChatPayloadSerializer(
            data={
                "circle_id": content.get("circle_id"),
                "room_key": content.get("room_key"),
                "room_label": content.get("room_label"),
                "province_key": content.get("province_key") or "",
                "sender_hash": content.get("sender_hash"),
                "body": content.get("body"),
            }
        )
        if not serializer.is_valid():
            detail = serializer.errors
            if isinstance(detail, dict):
                detail = next(iter(detail.values()), ["Message invalide."])
            if isinstance(detail, list):
                detail = detail[0]
            return {"error": str(detail or "Message invalide.")}

        room_key = serializer.validated_data["room_key"]
        room_label = serializer.validated_data["room_label"]
        province_key = (serializer.validated_data.get("province_key") or "")[:32]
        room, _created = ChatRoom.objects.get_or_create(
            slug=room_key,
            defaults={
                "label": room_label[:120],
                "province_key": province_key,
                "kind": ChatRoom.Kind.NEIGHBORHOOD,
            },
        )
        changed = False
        if room.label != room_label[:120]:
            room.label = room_label[:120]
            changed = True
        if room.province_key != province_key:
            room.province_key = province_key
            changed = True
        if changed:
            room.save(update_fields=["label", "province_key", "updated_at"])

        message = NeighborhoodChatMessage.objects.create(
            room=room,
            room_key=room_key,
            room_label=room.label,
            province_key=province_key,
            sender_hash=serializer.validated_data["sender_hash"],
            body=encrypt_message_content(serializer.validated_data["body"].strip()[:500]),
        )
        return {
            "room": ChatRoomSerializer(room).data,
            "circle_id": serializer.validated_data.get("circle_id") or room_key,
            "message": NeighborhoodChatMessageSerializer(message, context={"viewer_hash": serializer.validated_data["sender_hash"]}).data,
        }

    def _check_room_message_quota(self, sender_hash):
        raw_rate = str(getattr(settings, "REST_FRAMEWORK", {}).get("DEFAULT_THROTTLE_RATES", {}).get("message_create", "18/min"))
        try:
            max_count = max(1, int(raw_rate.split("/", 1)[0]))
        except (TypeError, ValueError):
            max_count = 18
        cache_key = f"semachat_room_rate:{sender_hash}"
        added = cache.add(cache_key, 1, timeout=60)
        if added:
            return True
        try:
            current = cache.incr(cache_key)
        except ValueError:
            cache.set(cache_key, 1, timeout=60)
            current = 1
        return int(current) <= max_count
