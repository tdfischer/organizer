from django.contrib import admin

class OrganizerAdmin(admin.AdminSite):
    site_header = 'Organizer Administration'

    def has_permission(self, request):
        person, _ = Person.objects.get_or_create(email=request.user.email)
        return person.is_captain or request.user.is_staff

admin_site = OrganizerAdmin(name='organizer-admin')

