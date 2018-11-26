# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from organizer.admin import admin_site, OrganizerModelAdmin

from . import models, importing

class DonationAdmin(ImportExportModelAdmin, OrganizerModelAdmin):
    resource_class = importing.DonationResource

    list_display = (
        'value', 'person', 'timestamp', 'recurring'
    )

    list_filter = (
        'person', 'recurring'
    )

admin.site.register(models.Donation, DonationAdmin)
admin_site.register(models.Donation, DonationAdmin)
