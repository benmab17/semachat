import importlib.util
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def _load_env_fallback(path):
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = value


if importlib.util.find_spec("dotenv") is not None:
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR / ".env")
else:
    _load_env_fallback(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
DEBUG = os.getenv("DEBUG", "True").lower() in ("1", "true", "yes", "on")
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "*").split(",") if h.strip()]

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "channels",
    "core",
]

SOCIAL_AUTH_ENABLED = importlib.util.find_spec("social_django") is not None
if SOCIAL_AUTH_ENABLED:
    INSTALLED_APPS.append("social_django")

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

ROOT_URLCONF = "kolona_data.urls"
ASGI_APPLICATION = "kolona_data.asgi.application"
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}
REDIS_URL = os.getenv("REDIS_URL", "").strip()
if REDIS_URL and importlib.util.find_spec("channels_redis") is not None:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [REDIS_URL],
                "capacity": int(os.getenv("CHANNEL_LAYER_CAPACITY", "1500")),
                "expiry": int(os.getenv("CHANNEL_LAYER_EXPIRY", "15")),
            },
        }
    }

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

if SOCIAL_AUTH_ENABLED:
    TEMPLATES[0]["OPTIONS"]["context_processors"].append(
        "social_django.context_processors.backends"
    )
    TEMPLATES[0]["OPTIONS"]["context_processors"].append(
        "social_django.context_processors.login_redirect"
    )

DATABASES = {
    "default": {
        "ENGINE": os.getenv("DB_ENGINE", "django.db.backends.sqlite3"),
        "NAME": os.getenv("DB_NAME", str(BASE_DIR / "db.sqlite3")),
        "USER": os.getenv("DB_USER", ""),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", ""),
        "PORT": os.getenv("DB_PORT", ""),
    }
}

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Kinshasa"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_THROTTLE_RATES": {
        "signalement_create": "5/hour",
        "message_create": os.getenv("MESSAGE_RATE_LIMIT", "18/min"),
    },
}

LOGIN_URL = "/auth/"
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/auth/"
SITE_NAME = "SemaChat"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]
if SOCIAL_AUTH_ENABLED:
    AUTHENTICATION_BACKENDS.insert(0, "social_core.backends.google.GoogleOAuth2")

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ["openid", "email", "profile"]

# Accept both legacy WEBPUSH_* names and short VAPID_* names.
WEBPUSH_VAPID_PUBLIC_KEY = os.getenv("WEBPUSH_VAPID_PUBLIC_KEY") or os.getenv("VAPID_PUBLIC_KEY", "")
WEBPUSH_VAPID_PRIVATE_KEY = os.getenv("WEBPUSH_VAPID_PRIVATE_KEY") or os.getenv("VAPID_PRIVATE_KEY", "")
WEBPUSH_CLAIMS_SUB = (
    os.getenv("WEBPUSH_CLAIMS_SUB")
    or os.getenv("VAPID_ADMIN_EMAIL")
    or "mailto:admin@kolona.local"
)
MESSAGE_ENCRYPTION_KEY = os.getenv("MESSAGE_ENCRYPTION_KEY", "")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
