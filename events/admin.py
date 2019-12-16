# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from . import models
from organizer.admin import admin_site, OrganizerModelAdmin
from rangefilter.filter import DateTimeRangeFilter
from crm.models import merge_models
from django.db import transaction

def merge_events(modeladmin, request, queryset):
    first = queryset[0]
    duplicates = queryset[1:]
    merged, relations = merge_models(first, *list(duplicates))
    with transaction.atomic():
        for d in duplicates:
            d.delete()
        for r in relations:
            r.save()
        merged.save()
merge_events.short_description = "Merge selected events and their attendee lists"

class EventAdmin(OrganizerModelAdmin):
    actions = (
        merge_events,
    )

    search_fields = [
        'name', 'location__raw'
    ]

    list_display = [
        'name', 'timestamp', 'end_timestamp', 'attendee_count'
    ]

    list_filter = (
        ('timestamp', DateTimeRangeFilter),
        ('end_timestamp', DateTimeRangeFilter)
    )

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

    def lat(self, obj):
        return obj.lat

    def lng(self, obj):
        return obj.lng

    filter_horizontal = ('attendees',)
    readonly_fields = ['lat', 'lng']

    def attendee_count(self, obj):
        return obj.attendees.count()

admin.site.register(models.Event, EventAdmin)
admin_site.register(models.Event, EventAdmin)
