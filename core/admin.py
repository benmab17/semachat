from .admin_site import strict_admin_site
from .models import (
    AdminBroadcast,
    CitizenProfile,
    Follow,
    Friendship,
    PushSubscription,
    ReputationNotification,
    RessourceMerci,
    RessourceSavoir,
    Signalement,
    SurveyPulse,
    Validation,
)

strict_admin_site.register(Signalement)
strict_admin_site.register(Validation)
strict_admin_site.register(RessourceSavoir)
strict_admin_site.register(RessourceMerci)
strict_admin_site.register(SurveyPulse)
strict_admin_site.register(CitizenProfile)
strict_admin_site.register(Follow)
strict_admin_site.register(Friendship)
strict_admin_site.register(ReputationNotification)
strict_admin_site.register(PushSubscription)
strict_admin_site.register(AdminBroadcast)
