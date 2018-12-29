# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from . import models
from crm.models import Person, PersonState
from organizer.admin import admin_site

def signup_approver(modeladmin, request, queryset):
    for signup in queryset:
        person, _ = Person.objects.update_or_create(email=signup.email)
        if signup.event is not None:
            event = signup.event
            event.attendees.add(person)
            event.save()
        signup.approved = True
        signup.save()
signup_approver.short_description = "Approve selected signups"

class SignupAdmin(admin.ModelAdmin):
    actions = [
        signup_approver
    ]

    list_display = [
        'email', 'created', 'event', 'approved'
    ]
    search_fields = [
        'email', 'event__name'
    ]
    list_filter = ('approved', ('event', admin.RelatedOnlyFieldListFilter))

admin.site.register(models.NewNeighborNotificationTarget)
admin.site.register(models.Signup, SignupAdmin)

admin_site.register(models.NewNeighborNotificationTarget)
admin_site.register(models.Signup, SignupAdmin)
