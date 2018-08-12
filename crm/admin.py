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
from django.db.models import Count
from . import models
from django.core.mail import send_mail
from django.conf import settings
from address.models import Locality
import StringIO

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
            return queryset.filter(current_turf=self.value())
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

class PersonAdmin(admin.ModelAdmin):
    search_fields = [
        'name', 'email', 'address__raw', 'address__locality__name',
        'current_turf__name', 'state__name'
    ]

    list_filter = [
        CityFilter,
        TurfFilter,
        StateFilter
    ]

    list_display = [
        'name', 'email', 'city', 'current_turf', 'state', 'valid_geo'
    ]

    select_related = ['state', 'address__locality']

    def valid_geo(self, obj):
        return not (obj.lat is None or obj.lng is None)

    def city(self, obj):
        return obj.address.locality

    readonly_fields = ['lat', 'lng']

    inlines  = [
        TurfMembershipInline,
    ]

class TurfAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'locality', 'member_count'
    ]

    def member_count(self, obj):
        return obj.member_count
    member_count.admin_order_field='member_count'

    def get_queryset(self, request):
        ret = super(TurfAdmin, self).get_queryset(request)
        return ret.annotate(member_count=Count('members'))

    inlines = [
        TurfMembershipInline
    ]


admin.site.register(models.Person, PersonAdmin)
admin.site.register(models.Turf, TurfAdmin)
admin.site.register(models.TurfMembership)
admin.site.register(models.PersonState)
