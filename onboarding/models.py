# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from crm.models import Turf, PersonState

class NewNeighborNotificationTarget(models.Model):
    turfs = models.ManyToManyField(Turf)
    email = models.CharField(max_length=200)
    last_notified = models.DateField(null=True)
    states = models.ManyToManyField(PersonState)

    def __unicode__(self):
        return '%s: %s states, %s turfs'%(self.email, self.states.count(), self.turfs.count())
