import hashlib
import json
import math
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.sessions.models import Session
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import IntegrityError
from django.db.models import Count, Max, Q
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.http import require_http_methods
from django.template.response import TemplateResponse
from django.shortcuts import render
from django.urls import NoReverseMatch, reverse
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle

try:
    from pywebpush import WebPushException, webpush
except Exception:  # pragma: no cover
    WebPushException = Exception
    webpush = None

from .models import (
    AdminBroadcast,
    AbuseReport,
    BroadcastComment,
    BroadcastReaction,
    ChatRoom,
    CitizenProfile,
    DebateOpinion,
    DirectMessage,
    Follow,
    Friendship,
    ModerationFlag,
    NeighborhoodChatMessage,
    PushSubscription,
    ReputationNotification,
    RessourceCitation,
    RessourceMention,
    RessourceMerci,
    RessourceSavoir,
    Signalement,
    SignalementPollVote,
    SignalementReaction,
    SignalementMoodReaction,
    SurveyPulse,
    Validation,
)
from .crypto import encrypt_message_content
from .serializers import (
    AdminBroadcastSerializer,
    BroadcastCommentPayloadSerializer,
    BroadcastCommentSerializer,
    BroadcastReactionSerializer,
    ChatRoomSerializer,
    CitizenProfileSerializer,
    DebateOpinionSerializer,
    DirectMessagePayloadSerializer,
    DirectMessageSerializer,
    MerciSerializer,
    NeighborhoodChatMessageSerializer,
    NeighborhoodChatPayloadSerializer,
    PushSubscriptionSerializer,
    ReputationNotificationSerializer,
    RessourceCitationSerializer,
    RessourceMentionSerializer,
    RessourceSavoirSerializer,
    SignalementSerializer,
    SignalementPollVoteSerializer,
    SignalementMoodReactionSerializer,
    SignalementReactionSerializer,
    SocialActionSerializer,
    SurveyPulseSerializer,
    ValidateReportSerializer,
)
from .realtime import send_to_device, send_to_map, send_to_room
from .security import get_request_ip_hash, validate_safe_text


def home_view(request):
    return render(request, "index.html")


def profile_view(request):
    return render(request, "profile.html")


def profile_detail_view(request, profile_id):
    profile = get_object_or_404(CitizenProfile, pk=profile_id)
    profile_user = profile.owner
    is_self_profile = bool(
        request.user.is_authenticated
        and profile_user is not None
        and request.user.id == profile_user.id
    )
    return render(
        request,
        "profile_detail.html",
        {
            "profile": profile,
            "profile_user": profile_user,
            "is_self_profile": is_self_profile,
        },
    )


def manifest_view(request):
    return TemplateResponse(
        request,
        "manifest.json",
        content_type="application/manifest+json",
    )


def service_worker_view(request):
    return TemplateResponse(
        request,
        "service-worker.js",
        content_type="application/javascript",
    )


def auth_view(request):
    UserModel = get_user_model()
    google_login_url = "#"
    try:
        google_login_url = reverse("social:begin", args=["google-oauth2"])
    except NoReverseMatch:
        google_login_url = "#"

    if request.method == "POST":
        form_type = request.POST.get("form_type")
        if form_type == "login":
            email = (request.POST.get("email") or "").strip()
            password = request.POST.get("password") or ""
            if not email or not password:
                messages.error(request, "Email et mot de passe sont requis.")
            else:
                try:
                    validate_email(email)
                except DjangoValidationError:
                    messages.error(request, "Adresse email invalide.")
                    return redirect("auth")
                target = UserModel.objects.filter(email__iexact=email).first()
                if target is not None and not target.is_active:
                    messages.error(request, "Votre compte a été suspendu pour non-respect des règles de la communauté.")
                    return redirect("auth")
                username = target.username if target else ""
                user = authenticate(request, username=username, password=password)
                if user is not None:
                    login(request, user)
                    return redirect("home")
                messages.error(request, "Connexion impossible. Vérifie tes identifiants.")
        elif form_type == "register":
            email = (request.POST.get("email") or "").strip().lower()
            password1 = request.POST.get("password1") or ""
            password2 = request.POST.get("password2") or ""

            if not email or not password1 or not password2:
                messages.error(request, "Tous les champs sont requis.")
            else:
                try:
                    validate_email(email)
                except DjangoValidationError:
                    messages.error(request, "Adresse email invalide.")
                    return redirect("auth")
            if not email or not password1 or not password2:
                pass
            elif password1 != password2:
                messages.error(request, "Les mots de passe ne correspondent pas.")
            elif len(password1) < 8:
                messages.error(request, "Mot de passe trop court (min 8 caractères).")
            elif UserModel.objects.filter(email__iexact=email).exists():
                messages.error(request, "Cet email est déjà utilisé.")
            else:
                base_username = email
                username = base_username
                suffix = 1
                while UserModel.objects.filter(username=username).exists():
                    suffix += 1
                    username = f"{base_username}-{suffix}"
                user = UserModel.objects.create_user(
                    username=username,
                    email=email,
                    password=password1,
                )
                login(request, user)
                return redirect("home")

    return render(
        request,
        "auth.html",
        {
            "google_login_url": google_login_url,
        },
    )


@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return redirect("auth")


def _is_superuser(user):
    return user.is_authenticated and user.is_superuser


def _is_staff(user):
    return user.is_authenticated and user.is_staff


@staff_member_required
def admin_control_view(request):
    suspicious_signalements = (
        Signalement.objects.filter(abuse_reports__isnull=False)
        .select_related()
        .annotate(
            abuse_count=Count("abuse_reports", distinct=True),
            latest_abuse_at=Max("abuse_reports__created_at"),
        )
        .order_by("-hidden_by_moderation", "-abuse_count", "-latest_abuse_at", "-created_at")
    )
    risky_profiles = (
        CitizenProfile.objects.filter(moderation_flags__isnull=False)
        .select_related("owner")
        .annotate(
            block_count=Count("moderation_flags", distinct=True),
            latest_block_at=Max("moderation_flags__created_at"),
        )
        .order_by("-block_count", "-latest_block_at", "-updated_at")
    )
    recent_abuse_reports = (
        AbuseReport.objects.select_related("signalement", "target_profile", "target_profile__owner")[:24]
    )
    total_reports = Signalement.objects.count()
    active_users = get_user_model().objects.filter(is_active=True).count()
    moderation_pending = Signalement.objects.filter(hidden_by_moderation=True).count()
    recent_interventions = AdminBroadcast.objects.exclude(target_room_key="").order_by("-created_at")[:10]
    consensus_chart = _build_admin_consensus_chart()
    return render(
        request,
        "admin_control.html",
        {
            "suspicious_signalements": suspicious_signalements,
            "risky_profiles": risky_profiles,
            "recent_abuse_reports": recent_abuse_reports,
            "total_abuse_reports": AbuseReport.objects.count(),
            "total_reports": total_reports,
            "active_users": active_users,
            "moderation_pending": moderation_pending,
            "recent_interventions": recent_interventions,
            "consensus_chart_json": json.dumps(consensus_chart, ensure_ascii=False),
            "consensus_chart": consensus_chart,
        },
    )


@staff_member_required
@require_http_methods(["POST"])
def admin_intervention_create_view(request):
    message = (request.POST.get("message") or "").strip()
    target_room_key = (request.POST.get("target_room_key") or "").strip().lower()
    target_room_label = (request.POST.get("target_room_label") or "").strip()
    target_province_key = (request.POST.get("target_province_key") or "").strip().upper()
    raw_lat = (request.POST.get("lat") or "").strip()
    raw_lng = (request.POST.get("lng") or "").strip()
    if not message or not target_room_key or not target_room_label:
        messages.error(request, "Message, cercle cible et libellé du cercle sont requis.")
        return redirect("admin-control")

    lat = Decimal(raw_lat) if raw_lat else None
    lng = Decimal(raw_lng) if raw_lng else None
    broadcast = AdminBroadcast.objects.create(
        kind=AdminBroadcast.Kind.ALERT,
        message=message[:280],
        priority=AdminBroadcast.Priority.URGENT,
        target_room_key=target_room_key[:120],
        target_room_label=target_room_label[:120],
        target_province_key=target_province_key[:32],
        lat=lat,
        lng=lng,
        created_by=request.user,
        is_active=True,
    )
    _broadcast_admin_intervention(broadcast)
    messages.success(request, f"Intervention envoyée vers {broadcast.target_room_label}.")
    return redirect("admin-control")


def _logout_user_sessions(user):
    if not user:
        return
    for session in Session.objects.all():
        data = session.get_decoded()
        if str(data.get("_auth_user_id", "")) == str(user.pk):
            session.delete()


@staff_member_required
@require_http_methods(["POST"])
def moderation_warn_user_view(request, profile_id):
    target_profile = get_object_or_404(CitizenProfile.objects.select_related("owner"), pk=profile_id)
    if not target_profile.device_hash:
        messages.error(request, "Notification impossible pour ce profil.")
        return redirect("admin-control")
    ReputationNotification.objects.create(
        recipient_hash=target_profile.device_hash,
        actor_hash="moderation",
        kind=ReputationNotification.Kind.REPUTATION,
        message="Avertissement SemaChat: votre contenu a été signalé. Merci de respecter les règles de la communauté.",
    )
    messages.success(request, "Avertissement envoyé.")
    return redirect("admin-control")


@staff_member_required
@require_http_methods(["POST"])
def moderation_ban_user_view(request, user_id):
    target_user = get_object_or_404(get_user_model(), pk=user_id)
    if target_user.is_superuser:
        messages.error(request, "Impossible de bloquer un superutilisateur.")
        return redirect("admin-control")
    if target_user.pk == request.user.pk:
        messages.error(request, "Vous ne pouvez pas bloquer votre propre compte.")
        return redirect("admin-control")
    if not target_user.is_active:
        messages.info(request, "Ce compte est déjà suspendu.")
        return redirect("admin-control")
    target_user.is_active = False
    target_user.save(update_fields=["is_active"])
    _logout_user_sessions(target_user)
    messages.success(request, f"Le compte {target_user.email or target_user.username} a été suspendu.")
    return redirect("admin-control")


@staff_member_required
@require_http_methods(["POST"])
def moderation_delete_all_reports_view(request, profile_id):
    target_profile = get_object_or_404(CitizenProfile.objects.select_related("owner"), pk=profile_id)
    deleted_count, _ = Signalement.objects.filter(reporter_hash=target_profile.device_hash).delete()
    messages.success(request, f"{deleted_count} signalement(s) supprimé(s) pour ce profil.")
    return redirect("admin-control")


def _request_device_hash(request):
    return (
        request.headers.get("X-Device-Hash")
        or request.query_params.get("device_hash")
        or request.data.get("device_hash")
        or request.data.get("reporter_hash")
        or request.data.get("unique_device_id")
        or request.GET.get("device_hash")
        or request.POST.get("device_hash")
        or request.POST.get("reporter_hash")
        or request.POST.get("unique_device_id")
        or ""
    ).strip()


def _vapid_configured():
    return bool(
        getattr(settings, "WEBPUSH_VAPID_PUBLIC_KEY", "")
        and getattr(settings, "WEBPUSH_VAPID_PRIVATE_KEY", "")
        and getattr(settings, "WEBPUSH_CLAIMS_SUB", "")
    )


def _push_payload_from_broadcast(broadcast):
    return {
        "title": broadcast.title or ("Alerte Autorité" if broadcast.priority == AdminBroadcast.Priority.URGENT else "Information Autorité"),
        "body": broadcast.message,
        "message": broadcast.message,
        "kind": broadcast.kind,
        "question": broadcast.question,
        "target_room_key": broadcast.target_room_key,
        "target_room_label": broadcast.target_room_label,
        "target_province_key": broadcast.target_province_key,
        "lat": float(broadcast.lat) if broadcast.lat is not None else None,
        "lng": float(broadcast.lng) if broadcast.lng is not None else None,
        "url": "/",
        "priority": broadcast.priority,
        "broadcast_id": broadcast.id,
    }


def _send_web_push_to_all(payload):
    if webpush is None or not _vapid_configured():
        return {"sent": 0, "failed": 0, "reason": "webpush_not_configured"}

    sent = 0
    failed = 0
    for sub in PushSubscription.objects.all().iterator():
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
        }
        try:
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=settings.WEBPUSH_VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.WEBPUSH_CLAIMS_SUB},
            )
            sent += 1
        except WebPushException:
            failed += 1
            sub.delete()
    return {"sent": sent, "failed": failed, "reason": ""}


def send_mass_push_notification_to_all(title, message, url="/", priority="URGENT", extra_payload=None):
    payload = {
        "title": str(title or "SemaChat").strip()[:140],
        "body": str(message or "").strip()[:280],
        "message": str(message or "").strip()[:280],
        "url": url or "/",
        "priority": priority or "URGENT",
        "icon": "/static/icons/icon-192.png",
        "badge": "/static/icons/icon-192.png",
        "vibrate": [220, 120, 220],
    }
    if extra_payload and isinstance(extra_payload, dict):
        payload.update(extra_payload)
    return _send_web_push_to_all(payload)


def _latest_live_admin_broadcast():
    for broadcast in AdminBroadcast.objects.filter(is_active=True).order_by("-created_at"):
        if broadcast.is_live:
            return broadcast
    return None


def _signalement_realtime_payload(signalement, request=None):
    serializer = SignalementSerializer(signalement, context={"request": request})
    return serializer.data


def _broadcast_signalement_created(signalement, request=None):
    send_to_map(
        "signalement.created",
        {"signalement": _signalement_realtime_payload(signalement, request=request)},
    )


def _broadcast_direct_message(message):
    payload = DirectMessageSerializer(
        message,
        context={"viewer_hash": message.recipient_hash},
    ).data
    send_to_device(
        message.recipient_hash,
        "social.direct_message",
        {"message": payload},
    )


def _broadcast_room_message(message):
    payload = NeighborhoodChatMessageSerializer(
        message,
        context={"viewer_hash": ""},
    ).data
    send_to_room(
        message.room_key,
        "social.room_message",
        {"message": payload},
    )


def _broadcast_notification(recipient_hash, notification):
    send_to_device(
        recipient_hash,
        "social.notification",
        {
            "notification": ReputationNotificationSerializer(notification).data,
        },
    )


def _broadcast_admin_intervention(broadcast):
    if not getattr(broadcast, "is_live", False):
        return
    payload = AdminBroadcastSerializer(broadcast).data
    target_room_key = str(broadcast.target_room_key or "").strip().lower()
    if target_room_key:
        send_to_room(target_room_key, "admin.intervention", {"broadcast": payload})
    else:
        send_to_map("admin.intervention", {"broadcast": payload})


def _broadcast_admin_payload(broadcast, event_type="admin.broadcast_stats"):
    if not getattr(broadcast, "is_live", False):
        return
    payload = AdminBroadcastSerializer(broadcast).data
    target_room_key = str(broadcast.target_room_key or "").strip().lower()
    if target_room_key:
        send_to_room(target_room_key, event_type, {"broadcast": payload})
    else:
        send_to_map(event_type, {"broadcast": payload})


def _broadcast_admin_comment(broadcast, comment):
    if not getattr(broadcast, "is_live", False):
        return
    payload = BroadcastCommentSerializer(comment, context={"viewer_hash": ""}).data
    target_room_key = str(broadcast.target_room_key or "").strip().lower()
    if target_room_key:
        send_to_room(target_room_key, "admin.broadcast_comment", {"broadcast_id": broadcast.id, "comment": payload})
    else:
        send_to_map("admin.broadcast_comment", {"broadcast_id": broadcast.id, "comment": payload})


@login_required
@user_passes_test(_is_superuser)
def admin_broadcast_view(request):
    if not request.user.is_superuser:
        return HttpResponseForbidden("Accès réservé aux superutilisateurs.")
    if request.method == "POST":
        form_type = (request.POST.get("form_type") or "broadcast").strip().lower()
        title = (request.POST.get("title") or "").strip()
        message = (request.POST.get("message") or "").strip()
        if form_type == "mass-push":
            if not title or not message:
                messages.error(request, "Le titre et le message sont requis pour la diffusion de masse.")
            else:
                try:
                    title = validate_safe_text(title, "Le titre")
                    message = validate_safe_text(message, "Le message")
                except Exception as exc:
                    messages.error(request, str(exc))
                    return redirect("admin-broadcast")
                broadcast = AdminBroadcast.objects.create(
                    title=title[:140],
                    kind=AdminBroadcast.Kind.ALERT,
                    message=message[:280],
                    priority=AdminBroadcast.Priority.URGENT,
                    created_by=request.user,
                    is_active=True,
                )
                result = send_mass_push_notification_to_all(
                    title=title,
                    message=message,
                    priority=AdminBroadcast.Priority.URGENT,
                    extra_payload={
                        "kind": "MASS_ALERT",
                        "broadcast_id": broadcast.id,
                    },
                )
                messages.success(
                    request,
                    f"Diffusion de masse envoyée. sent={result['sent']} failed={result['failed']}.",
                )
                return redirect("admin-broadcast")
        else:
            kind = (request.POST.get("kind") or AdminBroadcast.Kind.ALERT).upper()
            question = (request.POST.get("question") or "").strip()
            priority = request.POST.get("priority") or AdminBroadcast.Priority.INFO
            raw_lat = (request.POST.get("lat") or "").strip()
            raw_lng = (request.POST.get("lng") or "").strip()
            lat = Decimal(raw_lat) if raw_lat else None
            lng = Decimal(raw_lng) if raw_lng else None
            if kind not in (AdminBroadcast.Kind.ALERT, AdminBroadcast.Kind.SURVEY):
                kind = AdminBroadcast.Kind.ALERT
            if not message:
                messages.error(request, "Le message est requis.")
            elif kind == AdminBroadcast.Kind.SURVEY and not question:
                messages.error(request, "La question du sondage est requise.")
            else:
                if priority not in (AdminBroadcast.Priority.INFO, AdminBroadcast.Priority.URGENT):
                    priority = AdminBroadcast.Priority.INFO
                broadcast = AdminBroadcast.objects.create(
                    title=title[:140],
                    kind=kind,
                    message=message[:280],
                    question=question[:280],
                    priority=priority,
                    lat=lat,
                    lng=lng,
                    created_by=request.user,
                    is_active=True,
                )
                payload = _push_payload_from_broadcast(broadcast)
                result = _send_web_push_to_all(payload)
                messages.success(
                    request,
                    f"Broadcast envoyé. Push sent={result['sent']} failed={result['failed']}.",
                )
                return redirect("admin-broadcast")
    latest = _latest_live_admin_broadcast()
    recent_broadcasts = [item for item in AdminBroadcast.objects.order_by("-created_at")[:24] if item.is_live][:12]
    return render(
        request,
        "admin_broadcast.html",
        {
            "latest": latest,
            "recent_broadcasts": recent_broadcasts,
            "vapid_public_key": getattr(settings, "WEBPUSH_VAPID_PUBLIC_KEY", ""),
            "webpush_ready": bool(webpush is not None and _vapid_configured()),
        },
    )


@login_required
@user_passes_test(_is_staff)
def command_hq_view(request):
    if not request.user.is_staff:
        return HttpResponseForbidden("Accès réservé au staff.")

    if request.method == "POST":
        kind = (request.POST.get("kind") or AdminBroadcast.Kind.ALERT).upper()
        message = (request.POST.get("message") or "").strip()
        question = (request.POST.get("question") or "").strip()
        priority = request.POST.get("priority") or AdminBroadcast.Priority.INFO
        raw_lat = (request.POST.get("lat") or "").strip()
        raw_lng = (request.POST.get("lng") or "").strip()
        lat = Decimal(raw_lat) if raw_lat else None
        lng = Decimal(raw_lng) if raw_lng else None
        if kind not in (AdminBroadcast.Kind.ALERT, AdminBroadcast.Kind.SURVEY):
            kind = AdminBroadcast.Kind.ALERT
        if not message:
            messages.error(request, "Le message est requis.")
        elif kind == AdminBroadcast.Kind.SURVEY and not question:
            messages.error(request, "La question du sondage est requise.")
        else:
            if priority not in (AdminBroadcast.Priority.INFO, AdminBroadcast.Priority.URGENT):
                priority = AdminBroadcast.Priority.INFO
            broadcast = AdminBroadcast.objects.create(
                kind=kind,
                message=message[:280],
                question=question[:280],
                priority=priority,
                lat=lat,
                lng=lng,
                created_by=request.user,
                is_active=True,
            )
            result = _send_web_push_to_all(_push_payload_from_broadcast(broadcast))
            messages.success(
                request,
                f"Notification envoyée. sent={result['sent']} failed={result['failed']}.",
            )
            return redirect("command-hq")

    return render(
        request,
        "command_hq.html",
        {"webpush_ready": bool(webpush is not None and _vapid_configured())},
    )


XP_REPORT_SENT = 10
XP_KNOWLEDGE_SHARED = 20
XP_VOTE_RECEIVED = 2
XP_BROADCAST_COMMENT = 4
XP_BROADCAST_REACTION = 2
XP_BROADCAST_SURVEY = 3


def get_or_create_profile(device_hash, request_user=None):
    profile, _ = CitizenProfile.objects.get_or_create(device_hash=device_hash)
    if request_user is not None and request_user.is_authenticated and profile.owner_id is None:
        profile.owner = request_user
        profile.save(update_fields=["owner"])
    expected_rank = CitizenProfile.rank_for_points(profile.points)
    if profile.rank_title != expected_rank:
        profile.rank_title = expected_rank
        profile.level = CitizenProfile.level_for_points(profile.points)
        profile.save(update_fields=["rank_title", "level"])
    return profile


def grant_points(device_hash, amount, request_user=None):
    if not device_hash or amount <= 0:
        return None
    profile = get_or_create_profile(device_hash, request_user=request_user)
    previous_level = int(profile.level or 1)
    profile.add_points(amount)
    if previous_level < 7 <= int(profile.level or 1):
        notify_reputation_bonus(
            device_hash,
            "Badge débloqué: Éclaireur. Tes apports au savoir renforcent le consensus citoyen.",
        )
    return profile


def notify_reputation_bonus(device_hash, message):
    if not device_hash:
        return
    ReputationNotification.objects.create(
        recipient_hash=device_hash,
        actor_hash="",
        kind=ReputationNotification.Kind.REPUTATION,
        message=message,
    )


def notify_signalement_confirmed(signalement):
    if not signalement or not signalement.reporter_hash:
        return
    ReputationNotification.objects.create(
        recipient_hash=signalement.reporter_hash,
        actor_hash="",
        kind=ReputationNotification.Kind.REPUTATION,
        message=f"Quelqu'un a confirme ton signalement: {signalement.title[:80]}",
    )


def _build_admin_consensus_chart():
    target = (
        AdminBroadcast.objects.filter(kind=AdminBroadcast.Kind.SURVEY, is_active=True)
        .order_by("-created_at")
        .first()
    )
    if not target:
        return {"available": False, "series": []}

    survey_candidates = AdminBroadcast.objects.filter(
        kind=AdminBroadcast.Kind.SURVEY,
        is_active=True,
    ).order_by("-created_at")
    target = next((item for item in survey_candidates if item.is_power_related()), target)

    now = timezone.localtime()
    start = now.replace(minute=0, second=0, microsecond=0) - timedelta(hours=11)
    labels = []
    yes_by_label = {}
    no_by_label = {}
    for offset in range(12):
        slot = start + timedelta(hours=offset)
        label = slot.strftime("%H:%M")
        labels.append(label)
        yes_by_label[label] = 0
        no_by_label[label] = 0

    pulses = SurveyPulse.objects.filter(
        question_key=f"broadcast_{target.id}",
        created_at__gte=start,
    ).order_by("created_at")

    for pulse in pulses:
        slot = timezone.localtime(pulse.created_at).replace(minute=0, second=0, microsecond=0)
        label = slot.strftime("%H:%M")
        if label not in yes_by_label:
            continue
        if pulse.answer == SurveyPulse.Answer.YES:
            yes_by_label[label] += 1
        else:
            no_by_label[label] += 1

    peak_negative_hour = ""
    peak_negative_count = 0
    series = []
    for label in labels:
        yes_value = yes_by_label[label]
        no_value = no_by_label[label]
        total_value = yes_value + no_value
        if no_value > peak_negative_count:
            peak_negative_hour = label
            peak_negative_count = no_value
        series.append(
            {
                "label": label,
                "yes": yes_value,
                "no": no_value,
                "total": total_value,
            }
        )

    return {
        "available": True,
        "broadcast_id": target.id,
        "title": target.title or target.question or "Sondage Admin",
        "question": target.question or target.message,
        "series": series,
        "peak_negative_hour": peak_negative_hour,
        "peak_negative_count": peak_negative_count,
    }


def notify_admins_about_abuse(signalement):
    if not signalement:
        return
    admin_hashes = list(
        CitizenProfile.objects.filter(owner__is_superuser=True)
        .exclude(device_hash="")
        .values_list("device_hash", flat=True)
    )
    if not admin_hashes:
        return
    message = f"Plainte reçue pour abus: {signalement.title[:80]}"
    ReputationNotification.objects.bulk_create([
        ReputationNotification(
            recipient_hash=device_hash,
            actor_hash=signalement.reporter_hash or "",
            kind=ReputationNotification.Kind.REPUTATION,
            message=message,
        )
        for device_hash in admin_hashes
    ])


def notify_mutual_allies_on_alert(source_hash, signalement):
    if not source_hash:
        return

    outgoing = set(
        Friendship.objects.filter(user_hash=source_hash).values_list("ally_hash", flat=True)
    )
    if not outgoing:
        return

    incoming = set(
        Friendship.objects.filter(ally_hash=source_hash).values_list("user_hash", flat=True)
    )
    mutual_allies = outgoing.intersection(incoming)
    if not mutual_allies:
        return

    message = (
        "Urgence allié: "
        f"{signalement.title[:80]}"
    )
    bulk = [
        ReputationNotification(
            recipient_hash=ally_hash,
            actor_hash=source_hash,
            kind=ReputationNotification.Kind.ALLY_ALERT,
            message=message,
        )
        for ally_hash in mutual_allies
    ]
    ReputationNotification.objects.bulk_create(bulk)


def notify_followers_new_knowledge(source_hash, resource):
    if not source_hash:
        return

    followers = list(
        Follow.objects.filter(target_hash=source_hash).values_list("follower_hash", flat=True)
    )
    if not followers:
        return

    message = f"Nouveau partage savoir: {resource.title[:80]}"
    ReputationNotification.objects.bulk_create(
        [
            ReputationNotification(
                recipient_hash=follower_hash,
                actor_hash=source_hash,
                kind=ReputationNotification.Kind.FOLLOW_KNOWLEDGE,
                message=message,
            )
            for follower_hash in followers
        ]
    )


def _conversation_key(hash_a, hash_b):
    parts = sorted([str(hash_a or "").strip(), str(hash_b or "").strip()])
    return "::".join(parts)


def _are_mutual_allies(hash_a, hash_b):
    if not hash_a or not hash_b or hash_a == hash_b:
        return False
    return (
        Friendship.objects.filter(user_hash=hash_a, ally_hash=hash_b).exists()
        and Friendship.objects.filter(user_hash=hash_b, ally_hash=hash_a).exists()
    )


def _infer_room_kind(room_key):
    key = str(room_key or "").lower()
    if key.startswith("province-"):
        return ChatRoom.Kind.PROVINCE
    if key.startswith("ville-"):
        return ChatRoom.Kind.CITY
    if key.startswith("commune-"):
        return ChatRoom.Kind.COMMUNE
    return ChatRoom.Kind.NEIGHBORHOOD


def _get_or_create_chat_room(room_key, room_label, province_key=""):
    slug = str(room_key or "").strip().lower()[:120]
    if not slug:
        return None
    defaults = {
        "label": (str(room_label or "") or slug).strip()[:120],
        "province_key": (str(province_key or "") or "")[:32],
        "kind": _infer_room_kind(slug),
    }
    room, created = ChatRoom.objects.get_or_create(slug=slug, defaults=defaults)
    dirty = False
    if not created:
        if defaults["label"] and room.label != defaults["label"]:
            room.label = defaults["label"]
            dirty = True
        if defaults["province_key"] and room.province_key != defaults["province_key"]:
            room.province_key = defaults["province_key"]
            dirty = True
        if room.kind != defaults["kind"]:
            room.kind = defaults["kind"]
            dirty = True
    if dirty:
        room.save(update_fields=["label", "province_key", "kind", "updated_at"])
    return room


class SignalementCreateRateThrottle(SimpleRateThrottle):
    scope = "signalement_create"

    def get_cache_key(self, request, view):
        if getattr(view, "action", None) != "create":
            return None

        raw_ident = (
            request.headers.get("X-Device-Hash")
            or request.data.get("unique_device_id")
            or get_request_ip_hash(request)
        )
        ident = hashlib.sha256(raw_ident.encode("utf-8")).hexdigest()
        return self.cache_format % {"scope": self.scope, "ident": ident}


class MessageCreateRateThrottle(SimpleRateThrottle):
    scope = "message_create"

    def get_cache_key(self, request, view):
        raw_ident = (
            request.headers.get("X-Device-Hash")
            or request.data.get("sender_hash")
            or request.data.get("actor_hash")
            or get_request_ip_hash(request)
        )
        ident = hashlib.sha256(str(raw_ident).encode("utf-8")).hexdigest()
        return self.cache_format % {"scope": self.scope, "ident": ident}


def _enforce_message_throttle(request):
    throttle = MessageCreateRateThrottle()
    if throttle.allow_request(request, None):
        return None
    wait = throttle.wait()
    detail = "Trop de messages envoyés en peu de temps. Réessaie dans un instant."
    if wait:
        detail = f"{detail} Attends environ {int(math.ceil(wait))} s."
    return Response({"detail": detail}, status=status.HTTP_429_TOO_MANY_REQUESTS)


class SignalementViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = SignalementSerializer
    permission_classes = [permissions.AllowAny]

    def get_throttles(self):
        if self.action == "create":
            return [SignalementCreateRateThrottle()]
        return []

    def get_queryset(self):
        queryset = Signalement.objects.annotate(
            validation_count=Count("validations", distinct=True),
            reaction_count=Count("reactions", distinct=True),
            poll_yes_count=Count("poll_votes", filter=Q(poll_votes__answer=SignalementPollVote.Answer.YES), distinct=True),
            poll_no_count=Count("poll_votes", filter=Q(poll_votes__answer=SignalementPollVote.Answer.NO), distinct=True),
            support_count=Count("mood_reactions", filter=Q(mood_reactions__mood=SignalementMoodReaction.Mood.SUPPORT), distinct=True),
            compassion_count=Count("mood_reactions", filter=Q(mood_reactions__mood=SignalementMoodReaction.Mood.SAD), distinct=True),
            abuse_count=Count("abuse_reports", distinct=True),
        )
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(hidden_by_moderation=False)
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")

        if not lat or not lng:
            return queryset

        try:
            center_lat = float(lat)
            center_lng = float(lng)
        except ValueError:
            return queryset.none()

        return self._within_radius_km(queryset, center_lat, center_lng, radius_km=10)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code not in (status.HTTP_200_OK, status.HTTP_201_CREATED):
            return response

        reporter_hash = response.data.get("reporter_hash") or request.data.get("reporter_hash")
        created_signalement = None
        try:
            created_signalement = Signalement.objects.get(pk=response.data.get("id"))
        except Signalement.DoesNotExist:
            created_signalement = None
        if reporter_hash:
            grant_points(reporter_hash, XP_REPORT_SENT, request_user=request.user)
            if created_signalement is not None:
                notify_mutual_allies_on_alert(reporter_hash, created_signalement)
        if created_signalement is not None:
            _broadcast_signalement_created(created_signalement, request=request)
        return response

    def partial_update(self, request, *args, **kwargs):
        signalement = self.get_object()
        device_hash = _request_device_hash(request)
        if not device_hash:
            return Response(
                {"detail": "device_hash requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if str(signalement.reporter_hash) != str(device_hash):
            return Response(
                {"detail": "Modification non autorisee pour ce signalement."},
                status=status.HTTP_403_FORBIDDEN,
            )

        allowed_fields = {"title", "description", "category", "publish_anonymously"}
        if request.user.is_superuser:
            allowed_fields.add("is_poll")
        payload = {key: value for key, value in request.data.items() if key in allowed_fields}
        if not payload:
            return Response(
                {"detail": "Aucune modification valide fournie."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(signalement, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        signalement = self.get_object()
        device_hash = _request_device_hash(request)
        if not device_hash:
            return Response(
                {"detail": "device_hash requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if str(signalement.reporter_hash) != str(device_hash):
            return Response(
                {"detail": "Suppression non autorisee pour ce signalement."},
                status=status.HTTP_403_FORBIDDEN,
            )

        signalement.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="validate")
    def validate_report(self, request, pk=None):
        signalement = self.get_object()
        payload = ValidateReportSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        unique_device_id = payload.validated_data["unique_device_id"]

        try:
            Validation.objects.create(signalement=signalement, unique_device_id=unique_device_id)
            created = True
        except IntegrityError:
            created = False

        validation_count = signalement.validations.count()
        if created and signalement.status == Signalement.Status.PENDING and validation_count >= 3:
            signalement.status = Signalement.Status.VALIDATED
            signalement.save(update_fields=["status"])

        if created and signalement.reporter_hash:
            notify_signalement_confirmed(signalement)
            profile = grant_points(
                signalement.reporter_hash,
                XP_VOTE_RECEIVED,
                request_user=request.user,
            )
            if profile and (profile.points % 10 == 0):
                notify_reputation_bonus(
                    signalement.reporter_hash,
                    "Félicitations ! 5 personnes ont trouvé votre signalement utile. +10 points de réputation !",
                )

        return Response(
            {"created": created, "validation_count": validation_count, "status": signalement.status},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="poll-vote")
    def poll_vote(self, request, pk=None):
        signalement = self.get_object()
        if not signalement.is_poll:
            return Response({"detail": "Ce signalement n'est pas un sondage."}, status=status.HTTP_400_BAD_REQUEST)

        payload = SignalementPollVoteSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        unique_device_id = payload.validated_data["unique_device_id"]
        answer = payload.validated_data["answer"]

        try:
            SignalementPollVote.objects.create(
                signalement=signalement,
                unique_device_id=unique_device_id,
                answer=answer,
            )
            created = True
        except IntegrityError:
            created = False

        yes_count = signalement.poll_votes.filter(answer=SignalementPollVote.Answer.YES).count()
        no_count = signalement.poll_votes.filter(answer=SignalementPollVote.Answer.NO).count()
        total = yes_count + no_count
        yes_percentage = int(round((yes_count / total) * 100)) if total else 0
        no_percentage = int(round((no_count / total) * 100)) if total else 0

        return Response(
            {
                "created": created,
                "poll_yes_count": yes_count,
                "poll_no_count": no_count,
                "poll_total_count": total,
                "poll_yes_percentage": yes_percentage,
                "poll_no_percentage": no_percentage,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="mood")
    def mood_reaction(self, request, pk=None):
        signalement = self.get_object()
        payload = SignalementMoodReactionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        unique_device_id = payload.validated_data["unique_device_id"]
        mood = payload.validated_data["mood"]

        existing = SignalementMoodReaction.objects.filter(
            signalement=signalement,
            unique_device_id=unique_device_id,
        ).first()
        created = False
        removed = False
        if existing and existing.mood == mood:
            existing.delete()
            removed = True
        elif existing:
            existing.mood = mood
            existing.save(update_fields=["mood"])
            created = True
        else:
            SignalementMoodReaction.objects.create(
                signalement=signalement,
                unique_device_id=unique_device_id,
                mood=mood,
            )
            created = True

        support_count = signalement.mood_reactions.filter(mood=SignalementMoodReaction.Mood.SUPPORT).count()
        compassion_count = signalement.mood_reactions.filter(mood=SignalementMoodReaction.Mood.SAD).count()
        my_mood = ""
        if not removed:
            my_mood = mood

        return Response(
            {
                "created": created,
                "removed": removed,
                "support_count": support_count,
                "compassion_count": compassion_count,
                "my_mood": my_mood,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="report-abuse")
    def report_abuse(self, request, pk=None):
        signalement = self.get_object()
        payload = ValidateReportSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        reporter_hash = payload.validated_data["unique_device_id"]
        if not signalement.reporter_hash:
            return Response(
                {"detail": "Ce signalement ne peut pas être signalé pour le moment."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if str(reporter_hash) == str(signalement.reporter_hash):
            return Response(
                {"detail": "Vous ne pouvez pas signaler votre propre contenu."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target_profile = get_or_create_profile(signalement.reporter_hash)
        try:
            AbuseReport.objects.create(
                signalement=signalement,
                target_profile=target_profile,
                reported_by_hash=reporter_hash,
            )
            created = True
            abuse_count = signalement.abuse_reports.count()
            hidden = signalement.hidden_by_moderation
            if abuse_count >= 3 and not hidden:
                signalement.hidden_by_moderation = True
                signalement.save(update_fields=["hidden_by_moderation"])
                hidden = True
            notify_admins_about_abuse(signalement)
        except IntegrityError:
            created = False
            abuse_count = signalement.abuse_reports.count()
            hidden = signalement.hidden_by_moderation

        return Response(
            {
                "created": created,
                "abuse_count": abuse_count,
                "hidden": hidden,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get", "post"], url_path="debats")
    def debate_opinions(self, request, pk=None):
        signalement = self.get_object()
        if signalement.category not in (
            Signalement.Category.CONSTITUTION,
            Signalement.Category.POLITIQUE,
        ):
            return Response(
                {
                    "detail": "Débat indisponible pour cette catégorie.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.method.lower() == "get":
            queryset = signalement.debate_opinions.select_related("author").all()
            serializer = DebateOpinionSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Connecte-toi avec Google pour prendre la parole."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = DebateOpinionSerializer(
            data=request.data,
            context={"request": request, "signalement": signalement},
        )
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save(signalement=signalement, author=request.user)
        except IntegrityError:
            return Response(
                {"detail": "Un seul avis par signalement est autorisé pour cet appareil."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="reactions")
    def reactions(self, request, pk=None):
        signalement = self.get_object()
        if request.method.lower() == "get":
            serializer = SignalementReactionSerializer(
                signalement.reactions.order_by("-created_at"),
                many=True,
                context={"request": request},
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = SignalementReactionSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        reaction = serializer.save(signalement=signalement)
        if (
            signalement.reporter_hash
            and signalement.reporter_hash != reaction.unique_device_id
        ):
            notification = ReputationNotification.objects.create(
                recipient_hash=signalement.reporter_hash,
                actor_hash=reaction.unique_device_id,
                kind=ReputationNotification.Kind.REPUTATION,
                message="Quelqu'un a répondu à ton signalement sur SemaChat.",
            )
            _broadcast_notification(signalement.reporter_hash, notification)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"reactions/(?P<reaction_id>[^/.]+)")
    def delete_reaction(self, request, pk=None, reaction_id=None):
        signalement = self.get_object()
        unique_device_id = request.query_params.get("unique_device_id") or request.data.get("unique_device_id")
        if not unique_device_id:
            return Response(
                {"detail": "unique_device_id requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reaction = get_object_or_404(
            SignalementReaction,
            pk=reaction_id,
            signalement=signalement,
        )
        if str(reaction.unique_device_id) != str(unique_device_id):
            return Response(
                {"detail": "Suppression non autorisée pour cette réaction."},
                status=status.HTTP_403_FORBIDDEN,
            )
        reaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @staticmethod
    def _within_radius_km(queryset, center_lat, center_lng, radius_km):
        lat_delta = radius_km / 111.0
        lng_delta = radius_km / (111.0 * max(math.cos(math.radians(center_lat)), 0.01))

        candidates = queryset.filter(
            lat__gte=Decimal(str(center_lat - lat_delta)),
            lat__lte=Decimal(str(center_lat + lat_delta)),
            lng__gte=Decimal(str(center_lng - lng_delta)),
            lng__lte=Decimal(str(center_lng + lng_delta)),
        )

        selected_ids = []
        for item in candidates.only("id", "lat", "lng"):
            if SignalementViewSet._haversine_km(center_lat, center_lng, float(item.lat), float(item.lng)) <= radius_km:
                selected_ids.append(item.id)

        return queryset.filter(id__in=selected_ids)

    @staticmethod
    def _haversine_km(lat1, lng1, lat2, lng2):
        earth_km = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlng / 2) ** 2
        )
        return earth_km * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


class RessourceSavoirViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = RessourceSavoirSerializer
    permission_classes = [permissions.AllowAny]
    queryset = RessourceSavoir.objects.annotate(
        thanks_count=Count("mercis", distinct=True),
        citation_count=Count("citations", distinct=True),
    )

    def get_queryset(self):
        queryset = self.queryset
        institution = self.request.query_params.get("institution")
        category = self.request.query_params.get("category")
        contributor_hash = self.request.query_params.get("contributor_hash")

        if institution and institution != "ALL":
            queryset = queryset.filter(institution=institution)
        if category and category != "ALL":
            queryset = queryset.filter(category=category)
        if contributor_hash:
            queryset = queryset.filter(contributor_hash=contributor_hash)

        return queryset

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code not in (status.HTTP_200_OK, status.HTTP_201_CREATED):
            return response

        contributor_hash = (
            response.data.get("contributor_hash") or request.data.get("contributor_hash")
        )
        if contributor_hash:
            grant_points(contributor_hash, XP_KNOWLEDGE_SHARED, request_user=request.user)
            try:
                resource = RessourceSavoir.objects.get(pk=response.data.get("id"))
                notify_followers_new_knowledge(contributor_hash, resource)
            except RessourceSavoir.DoesNotExist:
                pass
        return response

    @action(detail=True, methods=["post"], url_path="merci")
    def thank_resource(self, request, pk=None):
        resource = self.get_object()
        payload = MerciSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        unique_device_id = payload.validated_data["unique_device_id"]

        try:
            RessourceMerci.objects.create(resource=resource, unique_device_id=unique_device_id)
            created = True
        except IntegrityError:
            created = False

        thanks_count = resource.mercis.count()
        return Response(
            {"created": created, "thanks_count": thanks_count},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="cite")
    def cite_resource(self, request, pk=None):
        resource = self.get_object()
        payload = RessourceCitationSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        unique_device_id = payload.validated_data["unique_device_id"]
        source = payload.validated_data["source"]
        try:
            RessourceCitation.objects.create(
                resource=resource,
                unique_device_id=unique_device_id,
                source=source,
            )
            created = True
        except IntegrityError:
            created = False
        return Response(
            {
                "created": created,
                "citation_count": resource.citations.count(),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="mention")
    def mention_resource(self, request, pk=None):
        resource = self.get_object()
        payload = RessourceMentionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        unique_device_id = payload.validated_data["unique_device_id"]
        grade = payload.validated_data["grade"]
        mention, created = RessourceMention.objects.update_or_create(
            resource=resource,
            unique_device_id=unique_device_id,
            defaults={"grade": grade},
        )
        counts = {
            "PASSABLE": resource.mentions.filter(grade=RessourceMention.Grade.PASSABLE).count(),
            "BIEN": resource.mentions.filter(grade=RessourceMention.Grade.BIEN).count(),
            "TRES_BIEN": resource.mentions.filter(grade=RessourceMention.Grade.TRES_BIEN).count(),
        }
        return Response(
            {
                "created": created,
                "grade": mention.grade,
                "mention_counts": counts,
            },
            status=status.HTTP_200_OK,
        )


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def social_profile_view(request):
    viewer_hash = request.query_params.get("viewer_hash", "")
    target_hash = request.query_params.get("target_hash") or viewer_hash
    if not target_hash:
        return Response({"detail": "target_hash requis."}, status=status.HTTP_400_BAD_REQUEST)

    profile = get_or_create_profile(target_hash)
    followers_count = Follow.objects.filter(target_hash=target_hash).count()
    following_count = Follow.objects.filter(follower_hash=target_hash).count()
    allies_count = Friendship.objects.filter(user_hash=target_hash).count()
    data = CitizenProfileSerializer(profile).data
    data.update(
        {
            "followers_count": followers_count,
            "following_count": following_count,
            "allies_count": allies_count,
            "is_following": bool(
                viewer_hash
                and viewer_hash != target_hash
                and Follow.objects.filter(
                    follower_hash=viewer_hash,
                    target_hash=target_hash,
                ).exists()
            ),
            "is_allied": bool(
                viewer_hash
                and viewer_hash != target_hash
                and Friendship.objects.filter(
                    user_hash=viewer_hash,
                    ally_hash=target_hash,
                ).exists()
            ),
            "is_mutual_ally": bool(
                viewer_hash
                and viewer_hash != target_hash
                and Friendship.objects.filter(
                    user_hash=viewer_hash,
                    ally_hash=target_hash,
                ).exists()
                and Friendship.objects.filter(
                    user_hash=target_hash,
                    ally_hash=viewer_hash,
                ).exists()
            ),
        }
    )
    consume_ceremony = request.query_params.get("consume_celebration") == "1"
    if consume_ceremony and viewer_hash and viewer_hash == target_hash and profile.celebration_pending:
        data["celebration_pending"] = True
        data["celebration_message"] = profile.celebration_message
        profile.celebration_pending = False
        profile.celebration_message = ""
        profile.save(update_fields=["celebration_pending", "celebration_message"])

    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def self_profile_summary_view(request):
    device_hash = (request.query_params.get("device_hash") or "").strip()
    if not device_hash:
        return Response({"detail": "device_hash requis."}, status=status.HTTP_400_BAD_REQUEST)

    profile = get_or_create_profile(device_hash, request_user=request.user)
    reports_qs = Signalement.objects.filter(reporter_hash=device_hash).annotate(
        validation_count=Count("validations", distinct=True),
        reaction_count=Count("reactions", distinct=True),
        support_count=Count("mood_reactions", filter=Q(mood_reactions__mood=SignalementMoodReaction.Mood.SUPPORT), distinct=True),
        compassion_count=Count("mood_reactions", filter=Q(mood_reactions__mood=SignalementMoodReaction.Mood.SAD), distinct=True),
    )
    total_reports = reports_qs.count()
    audio_reports = reports_qs.exclude(audio="").exclude(audio__isnull=True).count()
    votes_received = Validation.objects.filter(signalement__reporter_hash=device_hash).count()
    security_reports = reports_qs.filter(category=Signalement.Category.INSECURITE).count()
    constitution_reports = reports_qs.filter(category=Signalement.Category.CONSTITUTION).count()
    recent_reports = reports_qs.order_by("-created_at")[:8]

    return Response(
        {
            "profile": CitizenProfileSerializer(profile).data,
            "stats": {
                "alerts_posted": total_reports,
                "audios_recorded": audio_reports,
                "votes_received": votes_received,
                "security_reports": security_reports,
                "constitution_reports": constitution_reports,
                "first_report_posted": bool(total_reports >= 1),
            },
            "recent_reports": SignalementSerializer(
                recent_reports,
                many=True,
                context={"request": request},
            ).data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def social_follow_toggle_view(request):
    payload = SocialActionSerializer(data=request.data)
    payload.is_valid(raise_exception=True)
    actor_hash = payload.validated_data["actor_hash"]
    target_hash = payload.validated_data["target_hash"]
    get_or_create_profile(actor_hash, request_user=request.user)
    get_or_create_profile(target_hash)

    relation, created = Follow.objects.get_or_create(
        follower_hash=actor_hash,
        target_hash=target_hash,
    )
    if not created:
        relation.delete()

    followers_count = Follow.objects.filter(target_hash=target_hash).count()
    return Response(
        {"following": created, "followers_count": followers_count},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def social_ally_toggle_view(request):
    payload = SocialActionSerializer(data=request.data)
    payload.is_valid(raise_exception=True)
    actor_hash = payload.validated_data["actor_hash"]
    target_hash = payload.validated_data["target_hash"]
    get_or_create_profile(actor_hash, request_user=request.user)
    get_or_create_profile(target_hash)

    relation, created = Friendship.objects.get_or_create(
        user_hash=actor_hash,
        ally_hash=target_hash,
    )
    if not created:
        relation.delete()

    is_mutual = (
        Friendship.objects.filter(user_hash=actor_hash, ally_hash=target_hash).exists()
        and Friendship.objects.filter(user_hash=target_hash, ally_hash=actor_hash).exists()
    )

    return Response(
        {"allied": created, "is_mutual_ally": is_mutual},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def social_ally_request_view(request):
    payload = SocialActionSerializer(data=request.data)
    payload.is_valid(raise_exception=True)
    actor_hash = payload.validated_data["actor_hash"]
    target_hash = payload.validated_data["target_hash"]
    get_or_create_profile(actor_hash, request_user=request.user)
    get_or_create_profile(target_hash)

    Friendship.objects.get_or_create(
        user_hash=actor_hash,
        ally_hash=target_hash,
    )
    is_mutual = (
        Friendship.objects.filter(user_hash=actor_hash, ally_hash=target_hash).exists()
        and Friendship.objects.filter(user_hash=target_hash, ally_hash=actor_hash).exists()
    )
    return Response(
        {"allied": True, "is_mutual_ally": is_mutual},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def social_notifications_view(request):
    device_hash = request.query_params.get("device_hash")
    if not device_hash:
        return Response([], status=status.HTTP_200_OK)

    qs = ReputationNotification.objects.filter(recipient_hash=device_hash).order_by("-created_at")[:25]
    if request.query_params.get("mark_read") == "1":
        ReputationNotification.objects.filter(
            recipient_hash=device_hash,
            is_read=False,
        ).update(is_read=True)
    return Response(ReputationNotificationSerializer(qs, many=True).data, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
@permission_classes([permissions.AllowAny])
def social_direct_messages_view(request):
    if request.method == "GET":
        actor_hash = (request.query_params.get("actor_hash") or "").strip()
        target_hash = (request.query_params.get("target_hash") or "").strip()
        if not actor_hash or not target_hash:
            return Response({"detail": "actor_hash et target_hash requis."}, status=status.HTTP_400_BAD_REQUEST)
        if not _are_mutual_allies(actor_hash, target_hash):
            return Response({"detail": "Le chat privé est réservé aux alliés mutuels."}, status=status.HTTP_403_FORBIDDEN)
        conversation_key = _conversation_key(actor_hash, target_hash)
        rows = DirectMessage.objects.filter(conversation_key=conversation_key).order_by("-created_at")[:40]
        payload = DirectMessageSerializer(list(reversed(rows)), many=True, context={"viewer_hash": actor_hash}).data
        return Response(payload, status=status.HTTP_200_OK)

    throttle_response = _enforce_message_throttle(request)
    if throttle_response is not None:
        return throttle_response
    serializer = DirectMessagePayloadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    actor_hash = serializer.validated_data["actor_hash"]
    target_hash = serializer.validated_data["target_hash"]
    if not _are_mutual_allies(actor_hash, target_hash):
        return Response({"detail": "Le chat privé est réservé aux alliés mutuels."}, status=status.HTTP_403_FORBIDDEN)
    get_or_create_profile(actor_hash, request_user=request.user)
    get_or_create_profile(target_hash)
    message = DirectMessage.objects.create(
        conversation_key=_conversation_key(actor_hash, target_hash),
        sender_hash=actor_hash,
        recipient_hash=target_hash,
        body=encrypt_message_content(serializer.validated_data["body"].strip()[:500]),
    )
    notification = ReputationNotification.objects.create(
        recipient_hash=target_hash,
        actor_hash=actor_hash,
        kind=ReputationNotification.Kind.ALLY_ALERT,
        message="Nouveau message privé d'un allié.",
    )
    _broadcast_notification(target_hash, notification)
    _broadcast_direct_message(message)
    return Response(
        DirectMessageSerializer(message, context={"viewer_hash": actor_hash}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "POST"])
@permission_classes([permissions.AllowAny])
def social_neighborhood_messages_view(request):
    if request.method == "GET":
        room_key = (request.query_params.get("room_key") or "").strip().lower()
        viewer_hash = (request.query_params.get("viewer_hash") or "").strip()
        if not room_key:
            return Response([], status=status.HTTP_200_OK)
        room = _get_or_create_chat_room(
            room_key,
            request.query_params.get("room_label") or room_key,
            request.query_params.get("province_key") or "",
        )
        rows = (
            NeighborhoodChatMessage.objects.filter(room_key=room_key)
            .select_related("room")
            .order_by("-created_at")[:50]
        )
        payload = NeighborhoodChatMessageSerializer(list(reversed(rows)), many=True, context={"viewer_hash": viewer_hash}).data
        return Response(
            {
                "room": ChatRoomSerializer(room).data if room else None,
                "messages": payload,
            },
            status=status.HTTP_200_OK,
        )

    throttle_response = _enforce_message_throttle(request)
    if throttle_response is not None:
        return throttle_response
    serializer = NeighborhoodChatPayloadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    sender_hash = serializer.validated_data["sender_hash"]
    get_or_create_profile(sender_hash, request_user=request.user)
    room = _get_or_create_chat_room(
        serializer.validated_data["room_key"],
        serializer.validated_data["room_label"],
        serializer.validated_data.get("province_key") or "",
    )
    message = NeighborhoodChatMessage.objects.create(
        room=room,
        room_key=serializer.validated_data["room_key"],
        room_label=serializer.validated_data["room_label"][:120],
        province_key=(serializer.validated_data.get("province_key") or "")[:32],
        sender_hash=sender_hash,
        body=encrypt_message_content(serializer.validated_data["body"].strip()[:500]),
    )
    _broadcast_room_message(message)
    return Response(
        {
            "room": ChatRoomSerializer(room).data if room else None,
            "message": NeighborhoodChatMessageSerializer(
                message,
                context={"viewer_hash": sender_hash},
            ).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def social_message_updates_view(request):
    device_hash = (request.query_params.get("device_hash") or "").strip()
    room_key = (request.query_params.get("room_key") or "").strip().lower()
    since = (request.query_params.get("since") or "").strip()
    if not device_hash:
        return Response({"direct_messages": [], "room_messages": []}, status=status.HTTP_200_OK)

    direct_qs = DirectMessage.objects.filter(recipient_hash=device_hash).order_by("-created_at")
    room_qs = (
        NeighborhoodChatMessage.objects.filter(room_key=room_key)
        .select_related("room")
        .exclude(sender_hash=device_hash)
        .order_by("-created_at")
        if room_key else NeighborhoodChatMessage.objects.none()
    )
    if since:
        since_dt = parse_datetime(since)
        if since_dt is not None:
            direct_qs = direct_qs.filter(created_at__gt=since_dt)
            room_qs = room_qs.filter(created_at__gt=since_dt)

    direct_messages = DirectMessageSerializer(
        list(reversed(direct_qs[:12])),
        many=True,
        context={"viewer_hash": device_hash},
    ).data
    room_messages = NeighborhoodChatMessageSerializer(
        list(reversed(room_qs[:12])),
        many=True,
        context={"viewer_hash": device_hash},
    ).data
    return Response({"direct_messages": direct_messages, "room_messages": room_messages}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def social_leaderboard_view(request):
    try:
        limit = max(1, min(int(request.query_params.get("limit", "10")), 50))
    except ValueError:
        limit = 10

    top_profiles = CitizenProfile.objects.order_by("-points", "-updated_at")[:limit]
    rows = []
    for profile in top_profiles:
        rows.append(
            {
                "device_hash": profile.device_hash,
                "display_name": profile.public_display_name,
                "points": int(profile.points),
                "level": int(profile.level),
                "rank_title": profile.rank_title,
            }
        )
    return Response(rows, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def push_subscribe_view(request):
    serializer = PushSubscriptionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    sub, _ = PushSubscription.objects.update_or_create(
        endpoint=data["endpoint"],
        defaults={
            "p256dh": data["p256dh"],
            "auth": data["auth"],
            "device_hash": data.get("device_hash", ""),
            "user": request.user if request.user.is_authenticated else None,
        },
    )
    return Response(
        {"id": sub.id, "subscribed": True, "vapid_public_key": getattr(settings, "WEBPUSH_VAPID_PUBLIC_KEY", "")},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def push_public_key_view(request):
    return Response({"vapid_public_key": getattr(settings, "WEBPUSH_VAPID_PUBLIC_KEY", "")}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def admin_broadcast_latest_view(request):
    latest = _latest_live_admin_broadcast()
    if not latest:
        return Response({}, status=status.HTTP_200_OK)
    viewer_hash = (request.query_params.get("device_hash") or "").strip()
    return Response(
        AdminBroadcastSerializer(latest, context={"viewer_hash": viewer_hash}).data,
        status=status.HTTP_200_OK,
    )


@api_view(["GET", "POST"])
@permission_classes([permissions.AllowAny])
def admin_broadcast_thread_view(request):
    if request.method == "GET":
        try:
            broadcast_id = int(request.query_params.get("broadcast_id", "0"))
        except ValueError:
            broadcast_id = 0
        viewer_hash = (request.query_params.get("device_hash") or "").strip()
        if not broadcast_id:
            return Response({"detail": "broadcast_id requis."}, status=status.HTTP_400_BAD_REQUEST)
        broadcast = get_object_or_404(AdminBroadcast, pk=broadcast_id, is_active=True)
        if not broadcast.is_live:
            return Response({"detail": "Cette alerte n'est plus active."}, status=status.HTTP_410_GONE)
        comments = broadcast.comments.order_by("-created_at")[:60]
        return Response(
            {
                "broadcast": AdminBroadcastSerializer(broadcast, context={"viewer_hash": viewer_hash}).data,
                "comments": BroadcastCommentSerializer(
                    list(reversed(comments)),
                    many=True,
                    context={"viewer_hash": viewer_hash},
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    serializer = BroadcastCommentPayloadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    broadcast = get_object_or_404(AdminBroadcast, pk=serializer.validated_data["broadcast_id"], is_active=True)
    if not broadcast.is_live:
        return Response({"detail": "Cette alerte n'est plus active."}, status=status.HTTP_410_GONE)
    comment = BroadcastComment.objects.create(
        broadcast=broadcast,
        unique_device_id=serializer.validated_data["unique_device_id"],
        body=serializer.validated_data["body"].strip()[:500],
    )
    grant_points(
        serializer.validated_data["unique_device_id"],
        XP_BROADCAST_COMMENT,
        request_user=request.user,
    )
    _broadcast_admin_comment(broadcast, comment)
    return Response(
        BroadcastCommentSerializer(
            comment,
            context={"viewer_hash": serializer.validated_data["unique_device_id"]},
        ).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def admin_broadcast_react_view(request):
    serializer = BroadcastReactionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    broadcast = get_object_or_404(AdminBroadcast, pk=serializer.validated_data["broadcast_id"], is_active=True)
    if not broadcast.is_live:
        return Response({"detail": "Cette alerte n'est plus active."}, status=status.HTTP_410_GONE)
    device_hash = serializer.validated_data["unique_device_id"]
    kind = serializer.validated_data["kind"]

    existing = BroadcastReaction.objects.filter(
        broadcast=broadcast,
        unique_device_id=device_hash,
    ).first()
    if existing and existing.kind == kind:
        existing.delete()
        my_reaction = ""
    elif existing:
        existing.kind = kind
        existing.save(update_fields=["kind"])
        my_reaction = kind
    else:
        BroadcastReaction.objects.create(
            broadcast=broadcast,
            unique_device_id=device_hash,
            kind=kind,
        )
        grant_points(device_hash, XP_BROADCAST_REACTION, request_user=request.user)
        my_reaction = kind

    _broadcast_admin_payload(broadcast)
    data = AdminBroadcastSerializer(broadcast, context={"viewer_hash": device_hash}).data
    data["my_reaction"] = my_reaction
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def latest_poll_signalement_view(request):
    latest = (
        Signalement.objects.filter(is_poll=True)
        .annotate(
            validation_count=Count("validations", distinct=True),
            reaction_count=Count("reactions", distinct=True),
            poll_yes_count=Count("poll_votes", filter=Q(poll_votes__answer=SignalementPollVote.Answer.YES), distinct=True),
            poll_no_count=Count("poll_votes", filter=Q(poll_votes__answer=SignalementPollVote.Answer.NO), distinct=True),
            support_count=Count("mood_reactions", filter=Q(mood_reactions__mood=SignalementMoodReaction.Mood.SUPPORT), distinct=True),
            compassion_count=Count("mood_reactions", filter=Q(mood_reactions__mood=SignalementMoodReaction.Mood.SAD), distinct=True),
        )
        .first()
    )
    if not latest:
        return Response({}, status=status.HTTP_200_OK)
    return Response(SignalementSerializer(latest, context={"request": request}).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def send_push_notification(request):
    if not request.user.is_authenticated or not request.user.is_superuser:
        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    message = str(request.data.get("message", "")).strip()
    kind = str(request.data.get("kind", AdminBroadcast.Kind.ALERT)).upper()
    question = str(request.data.get("question", "")).strip()
    priority = str(request.data.get("priority", AdminBroadcast.Priority.INFO)).upper()
    raw_lat = request.data.get("lat")
    raw_lng = request.data.get("lng")
    if not message:
        return Response({"detail": "message requis."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        message = validate_safe_text(message, "Le message")
        question = validate_safe_text(question, "La question")
    except Exception as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    if kind not in (AdminBroadcast.Kind.ALERT, AdminBroadcast.Kind.SURVEY):
        kind = AdminBroadcast.Kind.ALERT
    if kind == AdminBroadcast.Kind.SURVEY and not question:
        return Response({"detail": "question requise."}, status=status.HTTP_400_BAD_REQUEST)
    if priority not in (AdminBroadcast.Priority.INFO, AdminBroadcast.Priority.URGENT):
        priority = AdminBroadcast.Priority.INFO
    lat = Decimal(str(raw_lat)) if raw_lat not in (None, "") else None
    lng = Decimal(str(raw_lng)) if raw_lng not in (None, "") else None

    broadcast = AdminBroadcast.objects.create(
        kind=kind,
        message=message[:280],
        question=question[:280],
        priority=priority,
        lat=lat,
        lng=lng,
        created_by=request.user,
        is_active=True,
    )
    payload = _push_payload_from_broadcast(broadcast)
    result = _send_web_push_to_all(payload)
    return Response(
        {
            "sent": result["sent"],
            "failed": result["failed"],
            "broadcast_id": broadcast.id,
            "kind": kind,
            "priority": priority,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def survey_response_view(request):
    payload = SurveyPulseSerializer(data=request.data)
    payload.is_valid(raise_exception=True)
    answer = payload.validated_data["answer"]
    unique_device_id = payload.validated_data["unique_device_id"]
    broadcast_id = payload.validated_data.get("broadcast_id")
    question_key = "electricity_tonight"
    if broadcast_id:
        broadcast = get_object_or_404(AdminBroadcast, pk=broadcast_id, is_active=True)
        if not broadcast.is_live:
            return Response({"detail": "Cette alerte n'est plus active."}, status=status.HTTP_410_GONE)
        question_key = f"broadcast_{broadcast.id}"

    pulse, created = SurveyPulse.objects.update_or_create(
        question_key=question_key,
        unique_device_id=unique_device_id,
        defaults={"answer": answer},
    )
    if created and broadcast_id:
        grant_points(unique_device_id, XP_BROADCAST_SURVEY, request_user=request.user)

    total = SurveyPulse.objects.filter(question_key=question_key).count()
    yes_count = SurveyPulse.objects.filter(
        question_key=question_key,
        answer=SurveyPulse.Answer.YES,
    ).count()
    yes_percentage = int(round((yes_count / total) * 100)) if total else 0
    if broadcast_id:
        _broadcast_admin_payload(broadcast)

    return Response(
        {
            "question_key": question_key,
            "broadcast_id": broadcast_id,
            "total": total,
            "yes_count": yes_count,
            "yes_percentage": yes_percentage,
            "no_count": total - yes_count,
        },
        status=status.HTTP_200_OK,
    )
