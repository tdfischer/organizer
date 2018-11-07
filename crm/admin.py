# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import csv
import logging
from django.utils.html import format_html
from django.core.urlresolvers import reverse
from django.template import loader
from django.urls.resolvers import NoReverseMatch
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
from onboarding.models import OnboardingComponent
from onboarding.jobs import runOnboarding
from filtering.models import FilterNode
from django.core.mail import send_mail
from django.conf import settings
from address.models import Locality
from organizer.admin import admin_site
import StringIO

def onboard_people(modeladmin, request, queryset):
    for person in queryset:
        runOnboarding.delay(person)
onboard_people.short_description = "Run onboarding for selected people"

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

def make_captain(modeladmin, request, queryset):
    for person in queryset:
        membership = person.turf_memberships.latest('joined_on')
        if membership is not None:
            membership.is_captain = True
            membership.save()
make_captain.short_description = 'Mark selected people as captains in their turf'

def unmake_captain(modeladmin, request, queryset):
    for person in queryset:
        membership = person.turf_memberships.latest('joined_on')
        if membership is not None:
            membership.is_captain = False
            membership.save()
unmake_captain.short_description = 'Strip turf captainship from selected people'

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
        return map(lambda x: (x.name, x.name),
                Locality.objects.all().distinct('name').order_by('name'))

    def queryset(self, request, queryset):
        if self.value() is not None:
            return queryset.filter(address__locality__name=self.value())
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

class NamedFilterFilter(admin.SimpleListFilter):
    title = 'Saved filters'
    parameter_name = 'named_filter'

    def lookups(self, request, model_admin):
        return map(lambda x: (x.id, x.name),
                FilterNode.objects.named_for_model(model_admin.model).order_by('name'))

    def queryset(self, request, queryset):
        if self.value() is not None:
            return FilterNode.objects.named().get(pk=self.value()).apply(queryset)
        return queryset

class PersonAdmin(ImportExportModelAdmin):
    resource_class = importing.PersonResource
    search_fields = [
        'name', 'email', 'address__raw', 'address__locality__name',
        'turf_memberships__turf__name', 'phone'
    ]

    fieldsets = (
        (None, {
            'fields': (('name', 'email'), ('phone', 'address'))
        }),
        ('Membership', {
            'fields': ('attendance_record', 'donation_record',
            'onboarding_status')
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
                ((reverse('organizer-admin:events_event_change', args=(evt.id, )),
                    evt.name, evt.timestamp) for evt in instance.events.all())
            ),
            format_html("<tr><th>Total</th><th>{}</th></tr>",
                instance.events.count())
        )

    def donation_record(self, instance):
        return format_html(
            "<table><tr><th>Amount</th><th>Date</th></tr>{}{}</table>",
            format_html_join('\n', "<tr><td><a href='{}'>{}</a></td><td>{}</td></tr>",
                ((reverse('organizer-admin:donations_donation_change', args=(donation.id, )),
                    donation.value/100, donation.timestamp) for donation in instance.donations.all())
            ),
            format_html("<tr><th>Total</th><th>{}</th></tr>",
                instance.donations.aggregate(sum=Sum('value')/100)['sum'])
        )

    def onboarding_status(self, instance):
        statuses = []
        for component in OnboardingComponent.objects.filter():
            if component.filter.results.filter(pk=instance.pk).exists():
                myStatus = instance.onboarding_statuses.filter(component=component)
                statusDate = "-"
                success = "Not yet attempted"
                statusLink = ""
                if myStatus.exists():
                    s = myStatus.first()
                    statusDate = s.created
                    success = str(s.success) + ": " + s.message
                    statusLink = ""
                    try:
                        statusLink = reverse('organizer-admin:onboarding_onboardingstatus_change', args=(s.id,)),
                    except NoReverseMatch:
                        pass

                statuses.append((
                    reverse('organizer-admin:onboarding_onboardingcomponent_change', args=(component.id,)),
                    component.name,
                    statusLink,
                    statusDate,
                    success
                ))

        return format_html(
            "<table><tr><th>Name</th><th>Date</th><th>Success</th></tr>{}</table>",
            format_html_join(
                '\n',
                "<tr><td><a href='{}'>{}</a></td><td><a href='{}'>{}</a></td><td>{}</td></tr>",
                iter(statuses)
            )
        )

    list_filter = (
        NamedFilterFilter,
        CityFilter,
        TurfFilter,
    )

    actions = (
        merge_people,
        make_captain,
        unmake_captain,
        onboard_people
    )

    list_display = [
        'name', 'email', 'phone', 'city', 'current_turf', 'valid_geo',
        'onboarded', 'is_captain'
    ]

    select_related = ['address__locality']

    def onboarded(self, obj):
        curCount = obj.onboarding_statuses.filter(success=True).aggregate(count=Count('component'))['count']
        total = OnboardingComponent.objects.filter(enabled=True).count()
        return "{0}/{1}".format(curCount, total)

    def valid_geo(self, obj):
        return not (obj.lat is None or obj.lng is None)

    def city(self, obj):
        return obj.address.locality

    readonly_fields = ['lat', 'lng', 'created', 'attendance_record',
    'donation_record', 'onboarding_status']

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
