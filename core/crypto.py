import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


_PREFIX = "enc:v1:"


def _message_cipher():
    explicit_key = str(getattr(settings, "MESSAGE_ENCRYPTION_KEY", "") or "").strip()
    if explicit_key:
        key = explicit_key.encode("utf-8")
    else:
        digest = hashlib.sha256(str(settings.SECRET_KEY).encode("utf-8")).digest()
        key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_message_content(value):
    text = str(value or "")
    if not text or text.startswith(_PREFIX):
        return text
    token = _message_cipher().encrypt(text.encode("utf-8")).decode("utf-8")
    return f"{_PREFIX}{token}"


def decrypt_message_content(value):
    text = str(value or "")
    if not text:
        return ""
    if not text.startswith(_PREFIX):
        return text
    token = text[len(_PREFIX):]
    try:
        return _message_cipher().decrypt(token.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError, TypeError):
        return ""
