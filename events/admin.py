# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from . import models

class EventAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'timestamp', 'end_timestamp', 'attendee_count'
    ]

    def attendee_count(self, obj):
        return obj.attendees.count()

admin.site.register(models.Event, EventAdmin)
