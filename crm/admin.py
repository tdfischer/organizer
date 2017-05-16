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
from . import models
from django.core.mail import send_mail
from django.conf import settings
from address.models import Locality
import StringIO

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

class PersonAdmin(admin.ModelAdmin):
    search_fields = [
        'name', 'email', 'address__raw', 'address__locality__name'
    ]

    list_filter = [
        CityFilter,
    ]

    list_display = [
        'name', 'email', 'address'
    ]


admin.site.register(models.Person, PersonAdmin)
