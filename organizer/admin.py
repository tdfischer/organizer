from django.contrib import admin

class OrganizerAdmin(admin.AdminSite):
    site_header = 'Organizer Administration'
    def has_permission(self, request):
        if request.user.is_anonymous:
            return False
        person, _ = Person.objects.get_or_create(email=request.user.email)
        return person.is_captain

admin_site = OrganizerAdmin(name='organizer-admin')

