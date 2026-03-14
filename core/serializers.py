from rest_framework import serializers

import unicodedata
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email

from .models import (
    AdminBroadcast,
    BroadcastComment,
    BroadcastReaction,
    ChatRoom,
    CitizenProfile,
    DebateOpinion,
    DirectMessage,
    ModerationFlag,
    NeighborhoodChatMessage,
    PushSubscription,
    ReputationNotification,
    RessourceCitation,
    RessourceMention,
    RessourceSavoir,
    Signalement,
    SignalementPollVote,
    SignalementReaction,
    SignalementMoodReaction,
    SurveyPulse,
)
from .crypto import decrypt_message_content
from .security import validate_safe_text

FORBIDDEN_SIGNAL_WORDS = [
    "sale tribu",
    "tribu de merde",
    "inyenzi",
    "cancrelat tribal",
    "kasaien de merde",
    "tutsi de merde",
    "luba de merde",
    "mongala de merde",
    "tetela de merde",
]


def _normalize_moderation_text(value):
    return (
        unicodedata.normalize("NFD", str(value or "").lower())
        .encode("ascii", "ignore")
        .decode("ascii")
    )


def _log_blocked_submission(request, attrs, normalized_text, forbidden_word):
    reporter_hash = (
        attrs.get("reporter_hash")
        or (request.data.get("reporter_hash") if request and hasattr(request, "data") else "")
        or ""
    ).strip()
    if not reporter_hash:
        return
    profile, _ = CitizenProfile.objects.get_or_create(device_hash=reporter_hash)
    excerpt = " ".join(filter(None, [
        attrs.get("title") or "",
        attrs.get("description") or "",
    ])).strip()[:280]
    ModerationFlag.objects.create(
        target_profile=profile,
        device_hash=reporter_hash,
        kind=ModerationFlag.Kind.BLOCKED_TEXT,
        reason=f"Mot interdit détecté: {forbidden_word}",
        excerpt=excerpt or normalized_text[:280],
    )


class SignalementSerializer(serializers.ModelSerializer):
    validation_count = serializers.IntegerField(read_only=True)
    reaction_count = serializers.IntegerField(read_only=True)
    video_duration_sec = serializers.FloatField(write_only=True, required=False)
    author_profile_id = serializers.SerializerMethodField()
    recent_reactions = serializers.SerializerMethodField()
    author_label = serializers.SerializerMethodField()
    poll_yes_count = serializers.SerializerMethodField()
    poll_no_count = serializers.SerializerMethodField()
    poll_total_count = serializers.SerializerMethodField()
    poll_yes_percentage = serializers.SerializerMethodField()
    poll_no_percentage = serializers.SerializerMethodField()
    support_count = serializers.SerializerMethodField()
    compassion_count = serializers.SerializerMethodField()
    my_mood = serializers.SerializerMethodField()

    def validate(self, attrs):
        video = attrs.get("video")
        duration = attrs.get("video_duration_sec")
        request = self.context.get("request")
        if "title" in attrs:
            attrs["title"] = validate_safe_text(attrs.get("title"), "Le titre")
        if "description" in attrs:
            attrs["description"] = validate_safe_text(attrs.get("description"), "Le témoignage")
        title = attrs.get("title")
        description = attrs.get("description")
        raw_text = " ".join([
            title if title is not None else getattr(self.instance, "title", ""),
            description if description is not None else getattr(self.instance, "description", ""),
        ])
        normalized_text = _normalize_moderation_text(raw_text)
        if video and getattr(video, "size", 0) > 15 * 1024 * 1024:
            raise serializers.ValidationError("La vidéo dépasse 15Mo.")
        if duration is not None and float(duration) > 15:
            raise serializers.ValidationError("La durée vidéo doit être <= 15 secondes.")
        if attrs.get("is_poll") and not (request and request.user and request.user.is_superuser):
            raise serializers.ValidationError("Le mode sondage est réservé à l'administration.")
        for forbidden_word in FORBIDDEN_SIGNAL_WORDS:
            if forbidden_word in normalized_text:
                _log_blocked_submission(request, attrs, raw_text, forbidden_word)
                raise serializers.ValidationError("Votre message contient des termes non autorisés par la charte SemaChat.")
        return attrs

    def create(self, validated_data):
        validated_data.pop("video_duration_sec", None)
        return super().create(validated_data)

    def get_author_profile_id(self, obj):
        if getattr(obj, "publish_anonymously", False):
            return None
        reporter_hash = getattr(obj, "reporter_hash", "")
        if not reporter_hash:
            return None
        profile, _ = CitizenProfile.objects.get_or_create(device_hash=reporter_hash)
        return profile.id

    def get_author_label(self, obj):
        if getattr(obj, "publish_anonymously", False):
            return "SemaCitoyen"
        reporter_hash = getattr(obj, "reporter_hash", "")
        if not reporter_hash:
            return "Etudiant anonyme"
        return None

    def get_recent_reactions(self, obj):
        rows = obj.reactions.order_by("-created_at")[:2]
        return SignalementReactionSerializer(rows, many=True, context=self.context).data

    def get_poll_yes_count(self, obj):
        return int(getattr(obj, "poll_yes_count", obj.poll_votes.filter(answer=SignalementPollVote.Answer.YES).count()) or 0)

    def get_poll_no_count(self, obj):
        return int(getattr(obj, "poll_no_count", obj.poll_votes.filter(answer=SignalementPollVote.Answer.NO).count()) or 0)

    def get_poll_total_count(self, obj):
        return self.get_poll_yes_count(obj) + self.get_poll_no_count(obj)

    def get_poll_yes_percentage(self, obj):
        total = self.get_poll_total_count(obj)
        return int(round((self.get_poll_yes_count(obj) / total) * 100)) if total else 0

    def get_poll_no_percentage(self, obj):
        total = self.get_poll_total_count(obj)
        return int(round((self.get_poll_no_count(obj) / total) * 100)) if total else 0

    def get_support_count(self, obj):
        return int(getattr(obj, "support_count", obj.mood_reactions.filter(mood=SignalementMoodReaction.Mood.SUPPORT).count()) or 0)

    def get_compassion_count(self, obj):
        return int(getattr(obj, "compassion_count", obj.mood_reactions.filter(mood=SignalementMoodReaction.Mood.SAD).count()) or 0)

    def get_my_mood(self, obj):
        request = self.context.get("request")
        viewer_device_id = ""
        if request is not None:
            viewer_device_id = (
                request.query_params.get("unique_device_id")
                or request.query_params.get("device_hash")
                or request.data.get("unique_device_id")
                or request.data.get("device_hash")
                or ""
            )
        if not viewer_device_id:
            return ""
        mood = obj.mood_reactions.filter(unique_device_id=viewer_device_id).values_list("mood", flat=True).first()
        return mood or ""

    class Meta:
        model = Signalement
        fields = [
            "id",
            "category",
            "title",
            "description",
            "reporter_hash",
            "publish_anonymously",
            "is_poll",
            "hidden_by_moderation",
            "image",
            "video",
            "audio",
            "video_duration_sec",
            "lat",
            "lng",
            "created_at",
            "status",
            "validation_count",
            "reaction_count",
            "author_profile_id",
            "author_label",
            "recent_reactions",
            "poll_yes_count",
            "poll_no_count",
            "poll_total_count",
            "poll_yes_percentage",
            "poll_no_percentage",
            "support_count",
            "compassion_count",
            "my_mood",
        ]
        read_only_fields = ["id", "created_at", "status", "validation_count", "hidden_by_moderation"]


class ValidateReportSerializer(serializers.Serializer):
    unique_device_id = serializers.CharField(min_length=16, max_length=128)


class SignalementPollVoteSerializer(serializers.Serializer):
    unique_device_id = serializers.CharField(min_length=16, max_length=128)
    answer = serializers.ChoiceField(choices=SignalementPollVote.Answer.choices)


class SignalementMoodReactionSerializer(serializers.Serializer):
    unique_device_id = serializers.CharField(min_length=16, max_length=128)
    mood = serializers.ChoiceField(choices=SignalementMoodReaction.Mood.choices)


class SignalementReactionSerializer(serializers.ModelSerializer):
    is_mine = serializers.SerializerMethodField()
    author_label = serializers.SerializerMethodField()

    def validate(self, attrs):
        fmt = attrs.get("format")
        if "text" in attrs:
            attrs["text"] = validate_safe_text(attrs.get("text"), "Le commentaire")
        text = (attrs.get("text") or "").strip()
        audio = attrs.get("audio")
        if fmt == SignalementReaction.Format.TEXT and not text:
            raise serializers.ValidationError("Le message texte est requis.")
        if fmt == SignalementReaction.Format.AUDIO and not audio:
            raise serializers.ValidationError("Le message audio est requis.")
        if fmt not in (SignalementReaction.Format.TEXT, SignalementReaction.Format.AUDIO):
            raise serializers.ValidationError("Format de réaction invalide.")
        return attrs

    def get_is_mine(self, obj):
        request = self.context.get("request")
        if not request:
            return False
        viewer_device_id = request.query_params.get("unique_device_id") or request.data.get("unique_device_id")
        if not viewer_device_id:
            return False
        return str(obj.unique_device_id) == str(viewer_device_id)

    def get_author_label(self, obj):
        code = "".join(ch for ch in str(obj.unique_device_id or "") if ch.isalnum()).upper()[:6]
        return "SemaCitoyen " + (code or "ANON")

    class Meta:
        model = SignalementReaction
        fields = [
            "id",
            "signalement",
            "unique_device_id",
            "format",
            "text",
            "audio",
            "created_at",
            "is_mine",
            "author_label",
        ]
        read_only_fields = ["id", "signalement", "created_at"]
        extra_kwargs = {
            "unique_device_id": {"write_only": True},
        }


class DebateOpinionSerializer(serializers.ModelSerializer):
    author_label = serializers.SerializerMethodField()

    def validate(self, attrs):
        if "text" in attrs:
            attrs["text"] = validate_safe_text(attrs.get("text"), "L'avis")
        if "transcription" in attrs:
            attrs["transcription"] = validate_safe_text(attrs.get("transcription"), "La transcription")
        if "pseudonym" in attrs:
            attrs["pseudonym"] = validate_safe_text(attrs.get("pseudonym"), "Le pseudonyme")
        text = (attrs.get("text") or "").strip()
        audio = attrs.get("audio")
        transcription = (attrs.get("transcription") or "").strip()
        if not text and not audio and not transcription:
            raise serializers.ValidationError("Ajoute un avis texte, vocal ou une transcription.")

        signalement = self.context.get("signalement")
        if signalement is not None and signalement.category not in (
            Signalement.Category.CONSTITUTION,
            Signalement.Category.POLITIQUE,
        ):
            raise serializers.ValidationError(
                "Le débat public est disponible uniquement pour Constitution ou Politique."
            )
        return attrs

    def get_author_label(self, obj):
        if obj.pseudonym:
            return obj.pseudonym
        return "Citoyen connecté"

    class Meta:
        model = DebateOpinion
        fields = [
            "id",
            "signalement",
            "unique_device_id",
            "pseudonym",
            "opinion_side",
            "text",
            "audio",
            "transcription",
            "created_at",
            "author_label",
        ]
        read_only_fields = ["id", "signalement", "created_at", "author_label"]
        extra_kwargs = {
            "unique_device_id": {"write_only": True},
        }


class RessourceSavoirSerializer(serializers.ModelSerializer):
    thanks_count = serializers.SerializerMethodField()
    citation_count = serializers.SerializerMethodField()
    author_profile_id = serializers.SerializerMethodField()
    author_label = serializers.SerializerMethodField()
    author_is_certified = serializers.SerializerMethodField()
    mention_counts = serializers.SerializerMethodField()
    top_mention = serializers.SerializerMethodField()
    my_mention = serializers.SerializerMethodField()

    def get_thanks_count(self, obj):
        value = getattr(obj, "thanks_count", None)
        if value is not None:
            return int(value)
        return obj.mercis.count()

    def get_citation_count(self, obj):
        value = getattr(obj, "citation_count", None)
        if value is not None:
            return int(value)
        return obj.citations.count()

    def validate(self, attrs):
        if "title" in attrs:
            attrs["title"] = validate_safe_text(attrs.get("title"), "Le titre")
        if "content" in attrs:
            attrs["content"] = validate_safe_text(attrs.get("content"), "Le contenu")
        if "tags" in attrs:
            attrs["tags"] = validate_safe_text(attrs.get("tags"), "Les tags")
        content = attrs.get("content", "")
        resource_link = attrs.get("resource_link", "")
        attachment = attrs.get("attachment")
        if not content and not resource_link and not attachment:
            raise serializers.ValidationError(
                "Ajoute un lien, un fichier ou un contenu texte pour partager la ressource."
            )
        return attrs

    def get_author_profile_id(self, obj):
        contributor_hash = getattr(obj, "contributor_hash", "")
        if not contributor_hash:
            return None
        profile, _ = CitizenProfile.objects.get_or_create(device_hash=contributor_hash)
        return profile.id

    def get_author_label(self, obj):
        contributor_hash = getattr(obj, "contributor_hash", "")
        if not contributor_hash:
            return "SemaÉtudiant"
        profile, _ = CitizenProfile.objects.get_or_create(device_hash=contributor_hash)
        return profile.public_display_name

    def get_author_is_certified(self, obj):
        contributor_hash = getattr(obj, "contributor_hash", "")
        if not contributor_hash:
            return False
        profile, _ = CitizenProfile.objects.get_or_create(device_hash=contributor_hash)
        owner = getattr(profile, "owner", None)
        if owner and (owner.is_staff or owner.is_superuser):
            return True
        name = (profile.display_name or "").strip().lower()
        tags = (getattr(obj, "tags", "") or "").lower()
        return any(token in name or token in tags for token in ("prof", "professeur", "assistant"))

    def get_mention_counts(self, obj):
        return {
            "PASSABLE": obj.mentions.filter(grade=RessourceMention.Grade.PASSABLE).count(),
            "BIEN": obj.mentions.filter(grade=RessourceMention.Grade.BIEN).count(),
            "TRES_BIEN": obj.mentions.filter(grade=RessourceMention.Grade.TRES_BIEN).count(),
        }

    def get_top_mention(self, obj):
        counts = self.get_mention_counts(obj)
        winner = max(counts.items(), key=lambda item: item[1])
        return winner[0] if winner[1] > 0 else ""

    def get_my_mention(self, obj):
        request = self.context.get("request")
        viewer_hash = ""
        if request is not None:
            viewer_hash = (
                request.query_params.get("unique_device_id")
                or request.query_params.get("device_hash")
                or ""
            ).strip()
        if not viewer_hash:
            return ""
        mention = obj.mentions.filter(unique_device_id=viewer_hash).values_list("grade", flat=True).first()
        return mention or ""

    class Meta:
        model = RessourceSavoir
        fields = [
            "id",
            "category",
            "institution",
            "title",
            "content",
            "resource_link",
            "tags",
            "attachment",
            "contributor_hash",
            "created_at",
            "thanks_count",
            "citation_count",
            "author_profile_id",
            "author_label",
            "author_is_certified",
            "mention_counts",
            "top_mention",
            "my_mention",
        ]
        read_only_fields = ["id", "created_at", "thanks_count"]


class MerciSerializer(serializers.Serializer):
    unique_device_id = serializers.CharField(min_length=16, max_length=128)


class RessourceCitationSerializer(serializers.Serializer):
    unique_device_id = serializers.CharField(min_length=16, max_length=128)
    source = serializers.ChoiceField(choices=RessourceCitation.Source.choices)


class RessourceMentionSerializer(serializers.Serializer):
    unique_device_id = serializers.CharField(min_length=16, max_length=128)
    grade = serializers.ChoiceField(choices=RessourceMention.Grade.choices)


class SurveyPulseSerializer(serializers.Serializer):
    answer = serializers.ChoiceField(choices=SurveyPulse.Answer.choices)
    unique_device_id = serializers.CharField(min_length=16, max_length=128)
    broadcast_id = serializers.IntegerField(required=False, min_value=1)


class SocialActionSerializer(serializers.Serializer):
    actor_hash = serializers.CharField(min_length=16, max_length=128)
    target_hash = serializers.CharField(min_length=16, max_length=128)

    def validate(self, attrs):
        if attrs["actor_hash"] == attrs["target_hash"]:
            raise serializers.ValidationError("Action impossible sur le même profil.")
        return attrs


class CitizenProfileSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    allies_count = serializers.IntegerField(read_only=True)
    knowledge_contribution_count = serializers.SerializerMethodField()
    reliability_badge = serializers.SerializerMethodField()

    def get_display_name(self, obj):
        return obj.public_display_name

    def validate_display_name(self, value):
        cleaned = validate_safe_text(value, "Le nom affiché")
        if not cleaned:
            return ""
        try:
            validate_email(cleaned)
        except DjangoValidationError:
            return cleaned
        raise serializers.ValidationError("Utilise un nom public, pas une adresse email.")

    def get_knowledge_contribution_count(self, obj):
        device_hash = str(obj.device_hash or "").strip()
        if not device_hash:
            return 0
        return (
            RessourceSavoir.objects.filter(contributor_hash=device_hash).count()
            + BroadcastComment.objects.filter(unique_device_id=device_hash).count()
            + BroadcastReaction.objects.filter(unique_device_id=device_hash).count()
            + SurveyPulse.objects.filter(unique_device_id=device_hash, question_key__startswith="broadcast_").count()
        )

    def get_reliability_badge(self, obj):
        device_hash = str(obj.device_hash or "").strip()
        if not device_hash:
            return ""

        aligned_votes = 0
        for pulse in SurveyPulse.objects.filter(
            unique_device_id=device_hash,
            question_key__startswith="broadcast_",
        ):
            try:
                broadcast_id = int(str(pulse.question_key).split("broadcast_", 1)[1])
            except (TypeError, ValueError, IndexError):
                continue
            broadcast = AdminBroadcast.objects.filter(pk=broadcast_id).first()
            if not broadcast:
                continue
            snapshot = broadcast.consensus_snapshot()
            if snapshot["total"] < 5:
                continue
            majority_answer = SurveyPulse.Answer.NO if snapshot["negative_ratio"] >= 0.5 else SurveyPulse.Answer.YES
            if pulse.answer == majority_answer:
                aligned_votes += 1

        if obj.level >= 7 or aligned_votes >= 3:
            return "Éclaireur"
        return ""

    class Meta:
        model = CitizenProfile
        fields = [
            "device_hash",
            "display_name",
            "points",
            "level",
            "rank_title",
            "celebration_pending",
            "celebration_message",
            "followers_count",
            "following_count",
            "allies_count",
            "knowledge_contribution_count",
            "reliability_badge",
        ]


class ReputationNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReputationNotification
        fields = [
            "id",
            "recipient_hash",
            "actor_hash",
            "message",
            "kind",
            "created_at",
            "is_read",
        ]


class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ["endpoint", "p256dh", "auth", "device_hash"]


class AdminBroadcastSerializer(serializers.ModelSerializer):
    yes_count = serializers.SerializerMethodField()
    no_count = serializers.SerializerMethodField()
    total_responses = serializers.SerializerMethodField()
    confirm_count = serializers.SerializerMethodField()
    disagree_count = serializers.SerializerMethodField()
    my_reaction = serializers.SerializerMethodField()
    critical_circle = serializers.SerializerMethodField()
    negative_ratio = serializers.SerializerMethodField()
    consensus_state = serializers.SerializerMethodField()

    def get_yes_count(self, obj):
        return obj.survey_counts()["yes_count"]

    def get_no_count(self, obj):
        return obj.survey_counts()["no_count"]

    def get_total_responses(self, obj):
        return obj.survey_counts()["total"]

    def get_confirm_count(self, obj):
        return obj.reaction_counts()["confirm_count"]

    def get_disagree_count(self, obj):
        return obj.reaction_counts()["disagree_count"]

    def get_my_reaction(self, obj):
        viewer_hash = (self.context.get("viewer_hash") or "").strip()
        if not viewer_hash:
            return ""
        reaction = (
            BroadcastReaction.objects.filter(
                broadcast=obj,
                unique_device_id=viewer_hash,
            ).values_list("kind", flat=True).first()
        )
        return reaction or ""

    def get_critical_circle(self, obj):
        return bool(obj.is_power_related() and obj.consensus_snapshot()["state"] == "critical")

    def get_negative_ratio(self, obj):
        return round(obj.consensus_snapshot()["negative_ratio"], 4)

    def get_consensus_state(self, obj):
        if not obj.is_power_related():
            return "stable"
        return obj.consensus_snapshot()["state"]

    def validate(self, attrs):
        if "message" in attrs:
            attrs["message"] = validate_safe_text(attrs.get("message"), "Le message")
        if "title" in attrs:
            attrs["title"] = validate_safe_text(attrs.get("title"), "Le titre")
        if "question" in attrs:
            attrs["question"] = validate_safe_text(attrs.get("question"), "La question")
        return attrs

    class Meta:
        model = AdminBroadcast
        fields = [
            "id",
            "title",
            "kind",
            "message",
            "question",
            "priority",
            "target_room_key",
            "target_room_label",
            "target_province_key",
            "duration_minutes",
            "lat",
            "lng",
            "created_at",
            "yes_count",
            "no_count",
            "total_responses",
            "confirm_count",
            "disagree_count",
            "my_reaction",
            "critical_circle",
            "negative_ratio",
            "consensus_state",
        ]


class BroadcastCommentSerializer(serializers.ModelSerializer):
    author_label = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    def get_author_label(self, obj):
        profile = CitizenProfile.objects.filter(device_hash=obj.unique_device_id).first()
        return profile.public_display_name if profile else "SemaCitoyen"

    def get_is_mine(self, obj):
        viewer_hash = (self.context.get("viewer_hash") or "").strip()
        return bool(viewer_hash and viewer_hash == obj.unique_device_id)

    class Meta:
        model = BroadcastComment
        fields = ["id", "unique_device_id", "body", "created_at", "author_label", "is_mine"]
        read_only_fields = ["id", "created_at", "author_label", "is_mine"]


class BroadcastCommentPayloadSerializer(serializers.Serializer):
    broadcast_id = serializers.IntegerField(min_value=1)
    unique_device_id = serializers.CharField(min_length=16, max_length=128)
    body = serializers.CharField(min_length=1, max_length=500)

    def validate_body(self, value):
        return validate_safe_text(value, "Le commentaire")


class BroadcastReactionSerializer(serializers.Serializer):
    broadcast_id = serializers.IntegerField(min_value=1)
    unique_device_id = serializers.CharField(min_length=16, max_length=128)
    kind = serializers.ChoiceField(choices=BroadcastReaction.Kind.choices)


class DirectMessageSerializer(serializers.ModelSerializer):
    body = serializers.SerializerMethodField()
    author_label = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    def get_body(self, obj):
        return decrypt_message_content(obj.body)

    def get_author_label(self, obj):
        profile = CitizenProfile.objects.filter(device_hash=obj.sender_hash).first()
        return profile.public_display_name if profile else "SemaCitoyen"

    def get_is_mine(self, obj):
        viewer_hash = (self.context.get("viewer_hash") or "").strip()
        return bool(viewer_hash and viewer_hash == obj.sender_hash)

    class Meta:
        model = DirectMessage
        fields = ["id", "sender_hash", "recipient_hash", "body", "created_at", "author_label", "is_mine"]
        read_only_fields = ["id", "created_at", "author_label", "is_mine"]


class NeighborhoodChatMessageSerializer(serializers.ModelSerializer):
    body = serializers.SerializerMethodField()
    author_label = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    def get_body(self, obj):
        return decrypt_message_content(obj.body)

    def get_author_label(self, obj):
        profile = CitizenProfile.objects.filter(device_hash=obj.sender_hash).first()
        return profile.public_display_name if profile else "SemaCitoyen"

    def get_is_mine(self, obj):
        viewer_hash = (self.context.get("viewer_hash") or "").strip()
        return bool(viewer_hash and viewer_hash == obj.sender_hash)

    class Meta:
        model = NeighborhoodChatMessage
        fields = [
            "id",
            "room",
            "room_key",
            "room_label",
            "province_key",
            "sender_hash",
            "body",
            "created_at",
            "author_label",
            "is_mine",
        ]
        read_only_fields = ["id", "created_at", "author_label", "is_mine"]


class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = ["id", "slug", "label", "province_key", "kind"]


class DirectMessagePayloadSerializer(serializers.Serializer):
    actor_hash = serializers.CharField(min_length=16, max_length=128)
    target_hash = serializers.CharField(min_length=16, max_length=128)
    body = serializers.CharField(min_length=1, max_length=500)

    def validate_body(self, value):
        return validate_safe_text(value, "Le message")

    def validate(self, attrs):
        if attrs["actor_hash"] == attrs["target_hash"]:
            raise serializers.ValidationError("Conversation invalide.")
        return attrs


class NeighborhoodChatPayloadSerializer(serializers.Serializer):
    circle_id = serializers.CharField(required=False, allow_blank=True, max_length=120)
    room_key = serializers.CharField(min_length=3, max_length=120)
    room_label = serializers.CharField(min_length=2, max_length=120)
    province_key = serializers.CharField(required=False, allow_blank=True, max_length=32)
    sender_hash = serializers.CharField(min_length=16, max_length=128)
    body = serializers.CharField(min_length=1, max_length=500)

    def validate_room_key(self, value):
        return validate_safe_text(value, "La zone").lower().replace(" ", "-")[:120]

    def validate_circle_id(self, value):
        return validate_safe_text(value, "Le cercle").lower().replace(" ", "-")[:120]

    def validate_room_label(self, value):
        return validate_safe_text(value, "Le salon")

    def validate_body(self, value):
        return validate_safe_text(value, "Le message")
