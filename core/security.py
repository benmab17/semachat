import hashlib
import hmac
import re

from django.conf import settings
from rest_framework import serializers


SUSPICIOUS_INPUT_PATTERNS = [
    re.compile(r"<\s*script", re.IGNORECASE),
    re.compile(r"javascript\s*:", re.IGNORECASE),
    re.compile(r"on\w+\s*=", re.IGNORECASE),
    re.compile(r"<\s*iframe", re.IGNORECASE),
    re.compile(r"(union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+\w+\s+set)", re.IGNORECASE),
    re.compile(r"(--|/\*|\*/|;)", re.IGNORECASE),
]


def hash_ip_address(ip_address):
    normalized = (ip_address or "anon").strip() or "anon"
    secret = settings.SECRET_KEY.encode("utf-8")
    return hmac.new(secret, normalized.encode("utf-8"), hashlib.sha256).hexdigest()


def hash_sensitive_identifier(value, namespace="semachat"):
    normalized = (value or "anon").strip() or "anon"
    secret = settings.SECRET_KEY.encode("utf-8")
    scoped = f"{namespace}:{normalized}".encode("utf-8")
    return hmac.new(secret, scoped, hashlib.sha256).hexdigest()


def get_request_ip_hash(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        candidate = forwarded_for.split(",")[0].strip()
        if candidate:
            return hash_ip_address(candidate)
    return hash_ip_address(request.META.get("REMOTE_ADDR", "anon"))


def validate_safe_text(value, field_label="Ce champ"):
    text = str(value or "").strip()
    if not text:
        return text
    for pattern in SUSPICIOUS_INPUT_PATTERNS:
        if pattern.search(text):
            raise serializers.ValidationError(
                f"{field_label} contient une séquence non autorisée."
            )
    return text
