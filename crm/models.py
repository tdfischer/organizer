# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.utils import timezone
from django.urls import reverse
from address.models import AddressField, Address, Locality
from taggit.managers import TaggableManager
from crm import geocache
import django_rq

def updatePersonGeo(personID):
    person = Person.objects.get(pk=personID)
    resolved = geocache.geocode(person.address.raw)
    turf = geocache.turfForAddress(person.address.raw)
    if turf:
        neighborhoodMembership, joinedNeighborhood = TurfMembership.objects.get_or_create(turf=turf,
                person=person)
        person.address = resolved
        person.lng = resolved.get('lng')
        person.lat = resolved.get('lat')
        person.save(_updateGeocache=False)
        return True
    else:
        #FIXME: log failure to find turf
        return False


class PersonState(models.Model):
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, default='')

    def __unicode__(self):
        return self.name

class Person(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(max_length=200, unique=True, db_index=True)
    address = AddressField(blank=True)
    created = models.DateTimeField(auto_now_add=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    state = models.ForeignKey(PersonState, db_index=True)

    tags = TaggableManager(blank=True)

    @property
    def geo(self):
        return {'lat': self.lat, 'lng': self.lng}

    def queue_geocache_update(self):
        django_rq.enqueue(updatePersonGeo, self.id)

    def save(self, *args, **kwargs):
        if not self.address_id:
            self.address = Address.objects.create()
        runUpdate = kwargs.pop('_updateGeocache', True)
        super(Person, self).save(*args, **kwargs)
        if runUpdate:
            self.queue_geocache_update()

    def __unicode__(self):
        ret = self.name.strip()
        if len(ret) == 0:
            return self.email
        return ret

class Turf(models.Model):
    name = models.CharField(max_length=200)
    locality = models.ForeignKey(Locality)

    def __unicode__(self):
        return "%s, %s"%(self.name, self.locality)

class TurfMembership(models.Model):
    person = models.ForeignKey(Person, related_name='turf_memberships',
            db_index=True)
    turf = models.ForeignKey(Turf, related_name='members', db_index=True)
    joined_on = models.DateField()
    is_captain = models.BooleanField(default=False)

    person_turf_index = models.Index(fields=['person', 'turf'])

    def save(self, *args, **kwargs):
        if not self.id:
            self.joined_on = timezone.now()
        return super(TurfMembership, self).save(*args, **kwargs)
