# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from address.models import AddressField
from crm.models import Person
from crm import geocache
import django_rq
import uuid

def updateEventGeo(eventID):
    event = Event.objects.get(pk=eventID)
    resolved = geocache.geocode(event.location.raw)
    event.location = resolved
    event.lng = resolved.get('lng')
    event.lat = resolved.get('lat')
    event.save(_updateGeocache=False)

class Event(models.Model):
    name = models.CharField(max_length=200)
    timestamp = models.DateTimeField()
    attendees = models.ManyToManyField(Person, related_name='events')
    uid = models.CharField(max_length=200, blank=True)
    location = AddressField(null=True, default=None)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    instance_id = models.CharField(max_length=200, blank=True)

    @property
    def geo(self):
        return {'lat': self.lat, 'lng': self.lng}

    def save(self, *args, **kwargs):
        runUpdate = kwargs.pop('_updateGeocache', True)
        super(Event, self).save(*args, **kwargs)
        if runUpdate:
            self.queue_geocache_update()

    def queue_geocache_update(self):
        django_rq.enqueue(updateEventGeo, self.id)

    def __unicode__(self):
        return "%s (%s)"%(self.name, self.timestamp)
