from django.contrib import admin

class OrganizerAdmin(admin.AdminSite):
    site_header = 'Organizer Administration'

admin_site = OrganizerAdmin(name='organizer-admin')

