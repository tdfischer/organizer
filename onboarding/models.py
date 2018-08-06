# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from crm.models import Turf, PersonState

class NewNeighborNotificationTarget(models.Model):
    turf = models.ForeignKey(Turf, related_name='notification_targets')
    email = models.CharField(max_length=200)
    last_notified = models.DateField(null=True)
    state = models.ForeignKey(PersonState)

    def __unicode__(self):
        return '%s: %s'%(self.email, self.turf)
