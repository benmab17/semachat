from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

from core.admin_site import strict_admin_site

urlpatterns = [
    path("gestion-privee-sema/", strict_admin_site.urls),
    path("", include("core.urls")),
]

if settings.SOCIAL_AUTH_ENABLED:
    urlpatterns += [
        path("oauth/", include("social_django.urls", namespace="social")),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
