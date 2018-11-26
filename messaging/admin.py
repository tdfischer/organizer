# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from . import models
from organizer.admin import admin_site, OrganizerModelAdmin

admin.site.register(models.Broadcast)
admin_site.register(models.Broadcast, OrganizerModelAdmin)
