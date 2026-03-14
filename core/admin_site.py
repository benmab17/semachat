from django.contrib.admin import AdminSite


class StrictAdminSite(AdminSite):
    site_header = "SemaChat Administration"
    site_title = "SemaChat Admin"
    index_title = "Gestion des signalements"

    def has_permission(self, request):
        user = request.user
        return user.is_active and user.is_staff and user.is_superuser


strict_admin_site = StrictAdminSite(name="strict_admin")
