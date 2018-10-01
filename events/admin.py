# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from . import models
from organizer.admin import admin_site

class EventAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'timestamp', 'end_timestamp', 'attendee_count'
    ]

    fieldsets = (
        (None, {
            'fields': ('name', ('timestamp', 'end_timestamp'),
                'location', 'attendees')
        }),
        ('Advanced options', {
            'classes': ('collapse',),
            'fields': (('lat', 'lng'), 'instance_id', 'uid')
        })
    )

    filter_horizontal = ('attendees',)

    def attendee_count(self, obj):
        return obj.attendees.count()

admin.site.register(models.Event, EventAdmin)
admin_site.register(models.Event, EventAdmin)
