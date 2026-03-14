import os

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import models
from django.utils import timezone

try:
    from cloudinary.models import CloudinaryField as _CloudinaryField
except ImportError:
    _CloudinaryField = None


def _has_cloudinary_config():
    return bool(
        os.getenv("CLOUDINARY_URL")
        or (
            os.getenv("CLOUDINARY_CLOUD_NAME")
            and os.getenv("CLOUDINARY_API_KEY")
            and os.getenv("CLOUDINARY_API_SECRET")
        )
    )


def _build_image_field():
    if _CloudinaryField is not None and _has_cloudinary_config():
        return _CloudinaryField("image", blank=True, null=True)
    return models.FileField("image", upload_to="signalements/", blank=True, null=True)


def _build_resource_file_field():
    # Keep attachments generic (PDF/image) and independent from cloud media config.
    return models.FileField("resource", upload_to="resources/", blank=True, null=True)


def _build_video_field():
    return models.FileField("video", upload_to="signalements/videos/", blank=True, null=True)


def _build_audio_field():
    return models.FileField("audio", upload_to="signalements/audio/", blank=True, null=True)


def _build_debate_audio_field():
    return models.FileField("audio", upload_to="debates/audio/", blank=True, null=True)


def _build_reaction_audio_field():
    return models.FileField("audio", upload_to="signalements/reactions/audio/", blank=True, null=True)


class Signalement(models.Model):
    class Category(models.TextChoices):
        ENERGIE = "ENERGIE", "Energie"
        EAU = "EAU", "Eau"
        INFRA = "INFRA", "Infrastructure"
        FRAIS = "FRAIS", "Frais illegaux"
        INSECURITE = "INSECURITE", "Insecurite"
        CONSTITUTION = "CONSTITUTION", "Constitution"
        POLITIQUE = "POLITIQUE", "Politique"
        RELIGION = "RELIGION", "Religion"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Signale"
        VALIDATED = "VALIDATED", "Verifie"
        RESOLVED = "RESOLVED", "Resolu"

    category = models.CharField(max_length=20, choices=Category.choices)
    title = models.CharField(max_length=140)
    description = models.TextField()
    reporter_hash = models.CharField(max_length=128, blank=True, db_index=True)
    publish_anonymously = models.BooleanField(default=False)
    is_poll = models.BooleanField(default=False)
    hidden_by_moderation = models.BooleanField(default=False)
    image = _build_image_field()
    video = _build_video_field()
    audio = _build_audio_field()
    lat = models.DecimalField(max_digits=9, decimal_places=6)
    lng = models.DecimalField(max_digits=9, decimal_places=6)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["lat", "lng"]),
            models.Index(fields=["reporter_hash", "created_at"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.category})"


class Validation(models.Model):
    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="validations",
    )
    unique_device_id = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["signalement", "unique_device_id"],
                name="unique_validation_per_device",
            )
        ]

    def __str__(self):
        return f"Validation {self.signalement_id} by {self.unique_device_id[:12]}"


class SignalementPollVote(models.Model):
    class Answer(models.TextChoices):
        YES = "YES", "Oui"
        NO = "NO", "Non"

    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="poll_votes",
    )
    unique_device_id = models.CharField(max_length=128)
    answer = models.CharField(max_length=8, choices=Answer.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["signalement", "unique_device_id"],
                name="unique_poll_vote_per_signalement_device",
            )
        ]

    def __str__(self):
        return f"PollVote {self.signalement_id} {self.answer}"


class SignalementReaction(models.Model):
    class Format(models.TextChoices):
        TEXT = "TEXT", "Texte"
        AUDIO = "AUDIO", "Audio"

    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="reactions",
    )
    unique_device_id = models.CharField(max_length=128, db_index=True)
    format = models.CharField(max_length=8, choices=Format.choices)
    text = models.TextField(blank=True)
    audio = _build_reaction_audio_field()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["signalement", "created_at"]),
        ]

    def __str__(self):
        return f"Reaction {self.signalement_id} ({self.format})"


class SignalementMoodReaction(models.Model):
    class Mood(models.TextChoices):
        SUPPORT = "SUPPORT", "Support"
        SAD = "SAD", "Compassion"

    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="mood_reactions",
    )
    unique_device_id = models.CharField(max_length=128, db_index=True)
    mood = models.CharField(max_length=16, choices=Mood.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["signalement", "unique_device_id"],
                name="unique_mood_reaction_per_signalement_device",
            )
        ]
        indexes = [
            models.Index(fields=["signalement", "mood", "created_at"]),
        ]

    def __str__(self):
        return f"MoodReaction {self.signalement_id} {self.mood}"


class AbuseReport(models.Model):
    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="abuse_reports",
    )
    target_profile = models.ForeignKey(
        "CitizenProfile",
        on_delete=models.CASCADE,
        related_name="abuse_reports_received",
    )
    reported_by_hash = models.CharField(max_length=128, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["signalement", "reported_by_hash"],
                name="unique_abuse_report_per_signalement_device",
            )
        ]
        indexes = [
            models.Index(fields=["target_profile", "created_at"]),
        ]

    def __str__(self):
        return f"AbuseReport {self.signalement_id} -> {self.target_profile_id}"


class ModerationFlag(models.Model):
    class Kind(models.TextChoices):
        BLOCKED_TEXT = "BLOCKED_TEXT", "Texte bloque"

    target_profile = models.ForeignKey(
        "CitizenProfile",
        on_delete=models.CASCADE,
        related_name="moderation_flags",
    )
    device_hash = models.CharField(max_length=128, db_index=True)
    kind = models.CharField(max_length=24, choices=Kind.choices, default=Kind.BLOCKED_TEXT)
    reason = models.CharField(max_length=220)
    excerpt = models.CharField(max_length=280, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["target_profile", "created_at"]),
            models.Index(fields=["device_hash", "created_at"]),
        ]

    def __str__(self):
        return f"ModerationFlag {self.target_profile_id} {self.kind}"


class DebateOpinion(models.Model):
    class Side(models.TextChoices):
        LEGAL = "LEGAL", "Arguments Legaux"
        CHANGE = "CHANGE", "Arguments de Changement"

    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="debate_opinions",
    )
    author = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="debate_opinions",
    )
    unique_device_id = models.CharField(max_length=128, db_index=True)
    pseudonym = models.CharField(max_length=64, blank=True)
    opinion_side = models.CharField(max_length=10, choices=Side.choices)
    text = models.TextField(blank=True)
    audio = _build_debate_audio_field()
    transcription = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["signalement", "unique_device_id"],
                name="unique_debate_opinion_per_signalement_device",
            )
        ]
        indexes = [
            models.Index(fields=["signalement", "opinion_side", "created_at"]),
        ]

    def __str__(self):
        side = "Legal" if self.opinion_side == self.Side.LEGAL else "Changement"
        return f"{side} #{self.signalement_id}"


class RessourceSavoir(models.Model):
    class Category(models.TextChoices):
        DROIT = "DROIT", "Droit"
        INFORMATIQUE = "INFORMATIQUE", "Informatique"
        MEDECINE = "MEDECINE", "Medecine"
        ECONOMIE = "ECONOMIE", "Economie"
        AUTRE = "AUTRE", "Autre"

    class Institution(models.TextChoices):
        UNIKIN = "UNIKIN", "UNIKIN"
        UPC = "UPC", "UPC"
        UNILU = "UNILU", "UNILU"
        UNIKIS = "UNIKIS", "UNIKIS"
        ISPA = "ISPA", "ISPA"
        PROVINCE = "PROVINCE", "Province"
        UNIGOM = "UNIGOM", "UNIGOM"
        UCC = "UCC", "UCC"
        AUTRE = "AUTRE", "Autre"

    category = models.CharField(max_length=20, choices=Category.choices)
    institution = models.CharField(max_length=20, choices=Institution.choices)
    title = models.CharField(max_length=160)
    content = models.TextField(blank=True)
    resource_link = models.URLField(blank=True)
    tags = models.CharField(max_length=180, blank=True, help_text="Tags separes par virgule")
    attachment = _build_resource_file_field()
    contributor_hash = models.CharField(max_length=128, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["institution", "category", "created_at"]),
            models.Index(fields=["contributor_hash", "created_at"]),
        ]

    def __str__(self):
        return f"{self.title} [{self.institution}]"


class RessourceMerci(models.Model):
    resource = models.ForeignKey(
        RessourceSavoir,
        on_delete=models.CASCADE,
        related_name="mercis",
    )
    unique_device_id = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["resource", "unique_device_id"],
                name="unique_merci_per_device",
            )
        ]


class RessourceCitation(models.Model):
    class Source(models.TextChoices):
        DOWNLOAD = "DOWNLOAD", "Téléchargement"
        SHARE = "SHARE", "Partage"

    resource = models.ForeignKey(
        RessourceSavoir,
        on_delete=models.CASCADE,
        related_name="citations",
    )
    unique_device_id = models.CharField(max_length=128, db_index=True)
    source = models.CharField(max_length=16, choices=Source.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["resource", "unique_device_id", "source"],
                name="unique_resource_citation_per_device_source",
            )
        ]


class RessourceMention(models.Model):
    class Grade(models.TextChoices):
        PASSABLE = "PASSABLE", "Passable"
        BIEN = "BIEN", "Bien"
        TRES_BIEN = "TRES_BIEN", "Mention Très Bien"

    resource = models.ForeignKey(
        RessourceSavoir,
        on_delete=models.CASCADE,
        related_name="mentions",
    )
    unique_device_id = models.CharField(max_length=128, db_index=True)
    grade = models.CharField(max_length=16, choices=Grade.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["resource", "unique_device_id"],
                name="unique_resource_mention_per_device",
            )
        ]


class SurveyPulse(models.Model):
    class Answer(models.TextChoices):
        YES = "YES", "Oui"
        NO = "NO", "Non"

    question_key = models.CharField(max_length=64, default="electricity_tonight")
    answer = models.CharField(max_length=8, choices=Answer.choices)
    unique_device_id = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["question_key", "unique_device_id"],
                name="unique_survey_per_device",
            )
        ]


class CitizenProfile(models.Model):
    """Anonymous profile bound to a device hash."""

    device_hash = models.CharField(max_length=128, unique=True)
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="citizen_profiles",
    )
    display_name = models.CharField(max_length=64, blank=True)
    points = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    rank_title = models.CharField(max_length=64, default="Bronze")
    milestone_announced = models.PositiveIntegerField(default=0)
    celebration_pending = models.BooleanField(default=False)
    celebration_message = models.CharField(max_length=220, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-points", "-updated_at"]
        indexes = [
            models.Index(fields=["-points"]),
            models.Index(fields=["-updated_at"]),
        ]

    def __str__(self):
        return self.display_name or f"Etudiant {self.device_hash[:8]}"

    @property
    def public_display_name(self):
        value = (self.display_name or "").strip()
        if value:
            try:
                validate_email(value)
            except DjangoValidationError:
                return value
        return f"Etudiant {self.device_hash[:8]}"

    @staticmethod
    def rank_for_points(points):
        p = max(0, int(points or 0))
        if p >= 501:
            return "Or"
        if p >= 101:
            return "Argent"
        return "Bronze"

    @staticmethod
    def level_for_points(points):
        p = max(0, int(points))
        level = 1
        remaining = p
        while remaining >= (95 + (level - 1) * 14):
            remaining -= (95 + (level - 1) * 14)
            level += 1
            if level > 200:
                break
        return level

    @property
    def rank_label(self):
        return self.rank_title or self.rank_for_points(self.points)

    @staticmethod
    def _top_milestone(points):
        if points >= 1000:
            return 1000
        if points >= 500:
            return 500
        if points >= 100:
            return 100
        return 0

    def add_points(self, amount):
        self.points = max(0, int(self.points) + int(amount))
        self.level = self.level_for_points(self.points)
        self.rank_title = self.rank_for_points(self.points)
        top_milestone = self._top_milestone(self.points)
        if top_milestone > int(self.milestone_announced or 0):
            self.milestone_announced = top_milestone
            self.celebration_pending = True
            self.celebration_message = (
                f"Félicitations ! Vous avez atteint {top_milestone} points. Nouveau rang: {self.rank_title}."
            )
        self.updated_at = timezone.now()
        self.save(
            update_fields=[
                "points",
                "level",
                "rank_title",
                "milestone_announced",
                "celebration_pending",
                "celebration_message",
                "updated_at",
            ]
        )


class Follow(models.Model):
    """One-way subscription for hub knowledge content."""

    follower_hash = models.CharField(max_length=128, db_index=True)
    target_hash = models.CharField(max_length=128, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower_hash", "target_hash"],
                name="unique_follow_relation",
            )
        ]
        indexes = [
            models.Index(fields=["target_hash", "created_at"]),
        ]


class Friendship(models.Model):
    """
    Ally relation.
    Alliance is considered mutual when both directions exist.
    """

    user_hash = models.CharField(max_length=128, db_index=True)
    ally_hash = models.CharField(max_length=128, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user_hash", "ally_hash"],
                name="unique_friendship_direction",
            )
        ]
        indexes = [
            models.Index(fields=["ally_hash", "created_at"]),
        ]


class DirectMessage(models.Model):
    conversation_key = models.CharField(max_length=260, db_index=True)
    sender_hash = models.CharField(max_length=128, db_index=True)
    recipient_hash = models.CharField(max_length=128, db_index=True)
    body = models.CharField(max_length=4096)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["recipient_hash", "created_at"]),
            models.Index(fields=["sender_hash", "created_at"]),
        ]

    def __str__(self):
        return f"DM {self.sender_hash[:8]} -> {self.recipient_hash[:8]}"


class ChatRoom(models.Model):
    class Kind(models.TextChoices):
        NEIGHBORHOOD = "NEIGHBORHOOD", "Quartier"
        COMMUNE = "COMMUNE", "Commune"
        CITY = "CITY", "Ville"
        PROVINCE = "PROVINCE", "Province"

    slug = models.SlugField(max_length=120, unique=True)
    label = models.CharField(max_length=120)
    province_key = models.CharField(max_length=32, blank=True)
    kind = models.CharField(max_length=24, choices=Kind.choices, default=Kind.NEIGHBORHOOD)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["label"]
        indexes = [
            models.Index(fields=["province_key", "label"]),
        ]

    def __str__(self):
        return self.label


class NeighborhoodChatMessage(models.Model):
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messages",
    )
    room_key = models.CharField(max_length=120, db_index=True)
    room_label = models.CharField(max_length=120)
    province_key = models.CharField(max_length=32, blank=True)
    sender_hash = models.CharField(max_length=128, db_index=True)
    body = models.CharField(max_length=4096)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["room_key", "created_at"]),
            models.Index(fields=["sender_hash", "created_at"]),
        ]

    def __str__(self):
        return f"Room {self.room_key} by {self.sender_hash[:8]}"


class ReputationNotification(models.Model):
    class Kind(models.TextChoices):
        ALLY_ALERT = "ALLY_ALERT", "Alerte allié"
        FOLLOW_KNOWLEDGE = "FOLLOW_KNOWLEDGE", "Publication suivi"
        REPUTATION = "REPUTATION", "Réputation"

    recipient_hash = models.CharField(max_length=128, db_index=True)
    actor_hash = models.CharField(max_length=128, blank=True)
    message = models.CharField(max_length=220)
    kind = models.CharField(max_length=24, choices=Kind.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient_hash", "created_at"]),
            models.Index(fields=["recipient_hash", "is_read"]),
        ]


class PushSubscription(models.Model):
    """Web Push subscription for anonymous device or authenticated user."""

    endpoint = models.URLField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    device_hash = models.CharField(max_length=128, blank=True, db_index=True)
    user = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="push_subscriptions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"PushSubscription({self.endpoint[:48]})"


class AdminBroadcast(models.Model):
    class Kind(models.TextChoices):
        ALERT = "ALERT", "Alerte"
        SURVEY = "SURVEY", "Sondage"

    class Priority(models.TextChoices):
        URGENT = "URGENT", "Urgent"
        INFO = "INFO", "Info"

    title = models.CharField(max_length=140, blank=True)
    kind = models.CharField(max_length=12, choices=Kind.choices, default=Kind.ALERT)
    message = models.CharField(max_length=280)
    question = models.CharField(max_length=280, blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.INFO)
    target_room_key = models.CharField(max_length=120, blank=True, db_index=True)
    target_room_label = models.CharField(max_length=120, blank=True)
    target_province_key = models.CharField(max_length=32, blank=True)
    duration_minutes = models.PositiveIntegerField(default=30)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_broadcasts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.priority}] {self.message[:40]}"

    @property
    def expires_at(self):
        return self.created_at + timezone.timedelta(minutes=max(1, int(self.duration_minutes or 0)))

    @property
    def is_live(self):
        if not self.is_active or not self.created_at:
            return False
        return timezone.now() <= self.expires_at

    def survey_counts(self):
        question_key = f"broadcast_{self.id}"
        yes_count = SurveyPulse.objects.filter(
            question_key=question_key,
            answer=SurveyPulse.Answer.YES,
        ).count()
        no_count = SurveyPulse.objects.filter(
            question_key=question_key,
            answer=SurveyPulse.Answer.NO,
        ).count()
        total = yes_count + no_count
        return {
            "yes_count": yes_count,
            "no_count": no_count,
            "total": total,
        }

    def reaction_counts(self):
        confirm_count = self.reactions.filter(kind=BroadcastReaction.Kind.CONFIRM).count()
        disagree_count = self.reactions.filter(kind=BroadcastReaction.Kind.DISAGREE).count()
        total = confirm_count + disagree_count
        return {
            "confirm_count": confirm_count,
            "disagree_count": disagree_count,
            "total": total,
        }

    def consensus_snapshot(self):
        survey = self.survey_counts()
        reactions = self.reaction_counts()
        positive = survey["yes_count"] + reactions["confirm_count"]
        negative = survey["no_count"] + reactions["disagree_count"]
        total = positive + negative
        negative_ratio = (negative / total) if total else 0
        positive_ratio = (positive / total) if total else 0

        if total >= 5 and negative_ratio >= 0.6:
            state = "critical"
        elif total >= 3 and negative_ratio >= 0.35:
            state = "warning"
        else:
            state = "stable"

        return {
            "positive": positive,
            "negative": negative,
            "total": total,
            "positive_ratio": positive_ratio,
            "negative_ratio": negative_ratio,
            "state": state,
        }

    def is_power_related(self):
        haystack = f"{self.title} {self.question} {self.message}".lower()
        return any(word in haystack for word in ("électricité", "electricite", "courant", "snel", "sneel"))


class BroadcastComment(models.Model):
    broadcast = models.ForeignKey(
        AdminBroadcast,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    unique_device_id = models.CharField(max_length=128, db_index=True)
    body = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["broadcast", "created_at"]),
        ]

    def __str__(self):
        return f"BroadcastComment {self.broadcast_id} by {self.unique_device_id[:8]}"


class BroadcastReaction(models.Model):
    class Kind(models.TextChoices):
        CONFIRM = "CONFIRM", "Je confirme"
        DISAGREE = "DISAGREE", "Pas d'accord"

    broadcast = models.ForeignKey(
        AdminBroadcast,
        on_delete=models.CASCADE,
        related_name="reactions",
    )
    unique_device_id = models.CharField(max_length=128, db_index=True)
    kind = models.CharField(max_length=16, choices=Kind.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["broadcast", "unique_device_id"],
                name="unique_broadcast_reaction_per_device",
            )
        ]
        indexes = [
            models.Index(fields=["broadcast", "kind", "created_at"]),
        ]

    def __str__(self):
        return f"BroadcastReaction {self.broadcast_id} {self.kind}"
