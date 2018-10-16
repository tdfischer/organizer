# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from . import models
from crm.models import Person
from organizer.admin import admin_site

def approve_signups(modeladmin, request, queryset):
    for signup in queryset:
        event = signup.event
        person = Person.objects.get_or_create(email=signup.email)[0]
        event.attendees.add(person)
        event.save()
        signup.approved = True
        signup.save()
approve_signups.short_description = "Approve selected signups"

class SignupAdmin(admin.ModelAdmin):
    list_display = [
        'email', 'created', 'event', 'approved'
    ]
    search_fields = [
        'email', 'event__name'
    ]
    list_filter = ('approved', ('event', admin.RelatedOnlyFieldListFilter))
    actions = [approve_signups]

admin.site.register(models.NewNeighborNotificationTarget)
admin.site.register(models.Signup, SignupAdmin)

admin_site.register(models.NewNeighborNotificationTarget)
admin_site.register(models.Signup, SignupAdmin)
