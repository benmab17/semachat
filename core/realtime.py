import re

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .security import hash_sensitive_identifier


def _group_slug(value):
    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "_", str(value or "").strip().lower())
    return cleaned[:80] or "default"


def map_group():
    return "map_live"


def device_group(device_hash):
    return f"device_{_group_slug(device_hash)}"


def room_group(room_key):
    return f"neighborhood_{hash_sensitive_identifier(room_key, namespace='room')[:24]}"


def _send_group(group_name, event_type, payload):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "semachat.event",
            "event_type": event_type,
            "payload": payload,
        },
    )


def send_to_map(event_type, payload):
    _send_group(map_group(), event_type, payload)


def send_to_device(device_hash, event_type, payload):
    if not device_hash:
        return
    _send_group(device_group(device_hash), event_type, payload)


def send_to_room(room_key, event_type, payload):
    if not room_key:
        return
    _send_group(room_group(room_key), event_type, payload)
