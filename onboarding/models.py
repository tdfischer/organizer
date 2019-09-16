# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
import importlib
import json
import django_rq
import logging

log = logging.getLogger(__name__)

from crm.models import Person
from filtering.models import FilterNode
from events.models import Event
from notifications.models import Notification

class NewEventSignup(Notification):
    name = 'new-event-signup'

class NewSignup(Notification):
    name = 'new-signup'

class OnboardingFailure(Notification):
    name = 'onboarding-failure'

class OnboardingSuccess(Notification):
    name = 'onboarding-success'

class Signup(models.Model):
    email = models.CharField(max_length=200)
    address = models.CharField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=200, blank=True, null=True)
    created = models.DateField(auto_now_add=True)
    approved = models.BooleanField(default=False)
    event = models.ForeignKey(Event, null=True, blank=True, related_name='signups')

    def save(self, *args, **kwargs):
        notify = False
        if self.id is None:
            notify = True
        super(Signup, self).save(*args, **kwargs)
        if notify:
            if self.event is None:
                NewSignup().send(self, 'signed up to join')
            else:
                NewEventSignup().send(self, 'RSVP\'d for', self.event)

    def __unicode__(self):
        return '%s: %s'%(self.email, self.event)

class ComponentManager(models.Manager):
    def get_queryset(self):
        return super(ComponentManager, self).get_queryset().filter(enabled=True)

class OnboardingComponent(models.Model):
    name = models.CharField(max_length=100)
    enabled = models.BooleanField()
    handler = models.CharField(max_length=200)
    configuration = models.TextField(default='', blank=True)
    filter = models.ForeignKey(FilterNode)

    def personHasBeenOnboarded(self, person):
        return self.statuses.filter(person=person, success=True).exists()

    def getComponentClass(self):
        module, cls = self.handler.rsplit('.', 1)
        return getattr(importlib.import_module(module), cls)

    def onboardPerson(self, person):
        Component = self.getComponentClass()
        config = {}
        if len(self.configuration) > 0:
            config = json.loads(self.configuration)
        instance = Component()
        return instance.handle(config, person)

    def __unicode__(self):
        return "{0} ({1})".format(self.name, self.handler)

class StatusManager(models.Manager):
    def successful(self):
        return super(StatusManager, self).get_queryset().order_by('created').filter(success=True)

class OnboardingStatus(models.Model):
    person = models.ForeignKey(Person, related_name='onboarding_statuses')
    created = models.DateField(auto_now_add=True)
    component = models.ForeignKey(OnboardingComponent, related_name='statuses')
    success = models.BooleanField()
    message = models.TextField()

    objects = StatusManager()

    def __unicode__(self):
        return "{0}: {1} - {2}".format(self.person, self.component,
                self.success)
