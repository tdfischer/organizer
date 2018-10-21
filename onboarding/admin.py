# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from . import models
from crm.models import Person, PersonState
from organizer.admin import admin_site

def make_approver(state):
    def signup_approver(modeladmin, request, queryset):
        for signup in queryset:
            person, _ = Person.objects.update_or_create(email=signup.email,
                    defaults=dict(
                        state=state
                    ))
            if signup.event is not None:
                event = signup.event
                event.attendees.add(person)
                event.save()
            signup.approved = True
            signup.save()
    signup_approver.short_description = "Approve selected signups as {0}".format(state.name)
    signup_approver.__name__ = str("approve_signups_{0}".format(state.name))
    return signup_approver

class SignupAdmin(admin.ModelAdmin):
    def get_actions(self, request):
        actions = super(SignupAdmin, self).get_actions(request)
        for state in PersonState.objects.all().order_by('name'):
            approver = make_approver(state)
            actions[approver.__name__] = (approver, approver.__name__,
                    approver.short_description)
        return actions

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
