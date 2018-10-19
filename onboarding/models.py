# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from crm.models import Turf, PersonState
from events.models import Event

class NewNeighborNotificationTarget(models.Model):
    turfs = models.ManyToManyField(Turf, related_name='notification_targets')
    email = models.CharField(max_length=200)
    last_notified = models.DateField(null=True)
    states = models.ManyToManyField(PersonState)

    def __unicode__(self):
        return '%s: %s states, %s turfs'%(self.email, self.states.count(), self.turfs.count())

class Signup(models.Model):
    email = models.CharField(max_length=200)
    created = models.DateField(auto_now_add=True)
    approved = models.BooleanField(default=False)
    event = models.ForeignKey(Event, null=True, blank=True)

    def __unicode__(self):
        return '%s: %s'%(self.email, self.event)
