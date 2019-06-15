# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.utils import timezone
from crm.models import Person
from geocodable.models import LocationAlias
import uuid

class Event(models.Model):
    name = models.CharField(max_length=200)
    timestamp = models.DateTimeField()
    end_timestamp = models.DateTimeField()
    attendees = models.ManyToManyField(Person, related_name='events', blank=True)
    uid = models.CharField(max_length=200, blank=True)
    location = models.ForeignKey(LocationAlias, default=None, blank=True,
            null=True)
    instance_id = models.CharField(max_length=200, blank=True)

    @property
    def geo(self):
        return {'lat': self.lat, 'lng': self.lng}

    @property
    def lat(self):
        if self.location is not None:
            return self.location.lat
        else:
            return None

    @property
    def lng(self):
        if self.location is not None:
            return self.location.lng
        else:
            return None

    def __unicode__(self):
        return "%s (%s)"%(self.name, self.timestamp)
