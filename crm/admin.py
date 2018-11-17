# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import csv
import logging
from django.utils.html import format_html
from django.core.urlresolvers import reverse
from django.template import loader
from django.conf.urls import url
from django.shortcuts import render
from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html_join
from django.utils.safestring import mark_safe
from django.db import transaction
from django.db.models import Count, Sum
from . import models, importing
from import_export.admin import ImportExportModelAdmin
import onboarding
from django.core.mail import send_mail
from django.conf import settings
from address.models import Locality
from organizer.admin import admin_site
import StringIO

def merge_people(modeladmin, request, queryset):
    matches = queryset.order_by('created')
    first = matches[0]
    duplicates = matches[1:]
    merged, relations = models.merge_models(first, *list(duplicates))
    with transaction.atomic():
        for d in duplicates:
            d.delete()
        for r in relations:
            r.save()
        merged.save()
merge_people.short_description = "Merge selected people"

class TurfMembershipInline(admin.TabularInline):
    model = models.TurfMembership

class TurfFilter(admin.SimpleListFilter):
    title = 'Turf'
    parameter_name = 'turf'

    def lookups(self, request, model_admin):
        return map(lambda x: (x.id, x.name),
                models.Turf.objects.all().order_by('name'))

    def queryset(self, request, queryset):
        if self.value() is not None:
            return queryset.filter(current_turf_id=self.value())
        return queryset

class CityFilter(admin.SimpleListFilter):
    title = 'City'
    parameter_name = 'city'

    def lookups(self, request, model_admin):
        return map(lambda x: (x.id, x.name),
                Locality.objects.all().order_by('name'))

    def queryset(self, request, queryset):
        if self.value() is not None:
            return queryset.filter(address__locality_id=self.value())
        return queryset

class LocalityFilter(CityFilter):
    title = 'City'
    parameter_name = 'locality'

    def lookups(self, request, model_admin):
        return map(lambda x: (x.id, x.name),
                Locality.objects.all().order_by('name'))

    def queryset(self, request, queryset):
        if self.value() is not None:
            return queryset.filter(locality_id=self.value())
        return queryset

class StateFilter(admin.SimpleListFilter):
    title = 'State'
    parameter_name = 'state'

    def lookups(self, request, model_admin):
        return map(lambda x: (x.id, x.name),
                models.PersonState.objects.all().order_by('name'))

    def queryset(self, request, queryset):
        if self.value() is not None:
            return queryset.filter(state_id=self.value())
        return queryset

class PersonAdmin(ImportExportModelAdmin):
    resource_class = importing.PersonResource
    search_fields = [
        'name', 'email', 'address__raw', 'address__locality__name',
        'turf_memberships__turf__name', 'state__name', 'phone'
    ]

    fieldsets = (
        (None, {
            'fields': (('name', 'email'), ('phone', 'address'), 'state',
            'attendance_record', 'donation_record')
        }),
        ('Advanced', {
            'classes': ('collapse',),
            'fields': ('lat', 'lng', 'created')
        })
    )

    def attendance_record(self, instance):
        return format_html(
            "<table><tr><th>Name</th><th>Date</th></tr>{}{}</table>",
            format_html_join('\n', "<tr><td><a href='{}'>{}</a></td><td>{}</td></tr>",
                ((reverse('admin:events_event_change', args=(evt.id, )),
                    evt.name, evt.timestamp) for evt in instance.events.all())
            ),
            format_html("<tr><th>Total</th><th>{}</th></tr>",
                instance.events.count())
        )

    def donation_record(self, instance):
        return format_html(
            "<table><tr><th>Amount</th><th>Date</th></tr>{}{}</table>",
            format_html_join('\n', "<tr><td><a href='{}'>{}</a></td><td>{}</td></tr>",
                ((reverse('admin:donations_donation_change', args=(donation.id, )),
                    donation.value/100, donation.timestamp) for donation in instance.donations.all())
            ),
            format_html("<tr><th>Total</th><th>{}</th></tr>",
                instance.donations.aggregate(sum=Sum('value')/100)['sum'])
        )

    list_filter = (
        ('state', admin.RelatedOnlyFieldListFilter),
        CityFilter,
        TurfFilter,
    )

    actions = (
        merge_people,
    )

    list_display = [
        'name', 'email', 'phone', 'city', 'current_turf', 'state', 'valid_geo'
    ]

    select_related = ['state', 'address__locality']

    def valid_geo(self, obj):
        return not (obj.lat is None or obj.lng is None)

    def city(self, obj):
        return obj.address.locality

    readonly_fields = ['lat', 'lng', 'created', 'attendance_record',
    'donation_record']

    inlines  = [
        TurfMembershipInline,
    ]

class NeighborNotificationInline(admin.TabularInline):
    model = models.Turf.notification_targets.through

class TurfAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'locality', 'member_count', 'has_notification'
    ]

    exclude = ['notification_targets']

    list_filter = (
        LocalityFilter,
    )

    def has_notification(self, obj):
        return obj.notification_targets.count() > 0

    def member_count(self, obj):
        return obj.member_count
    member_count.admin_order_field='member_count'

    def get_queryset(self, request):
        ret = super(TurfAdmin, self).get_queryset(request)
        return ret.annotate(member_count=Count('members'))

    inlines = [
        TurfMembershipInline,
        NeighborNotificationInline
    ]


admin.site.register(models.Person, PersonAdmin)
admin.site.register(models.Turf, TurfAdmin)
admin.site.register(models.TurfMembership)
admin.site.register(models.PersonState)

admin_site.register(models.Person, PersonAdmin)
admin_site.register(models.Turf, TurfAdmin)
