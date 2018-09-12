# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.db.models import Q, Subquery, OuterRef
from django.utils import timezone
from django.urls import reverse
from django.conf import settings
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
        try:
            person.address = resolved
        except UnicodeDecodeError, e:
            print "Unicode error", e
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

class PersonManager(models.Manager):
    def get_queryset(self):
        myTurfs = Turf.objects.filter(members__person__id=OuterRef('pk')).order_by('-members__joined_on')
        return super(PersonManager, self).get_queryset().annotate(current_turf_id=Subquery(myTurfs.values('id')[:1]))

class Person(models.Model):
    name = models.CharField(max_length=200, null=True, blank=True, default='')
    email = models.EmailField(max_length=200, unique=True, db_index=True)
    address = AddressField(blank=True)
    phone = models.CharField(max_length=200, null=True, blank=True, default=None)
    created = models.DateTimeField(auto_now_add=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    state = models.ForeignKey(PersonState, db_index=True)


    objects = PersonManager()

    tags = TaggableManager(blank=True)

    @property
    def geo(self):
        return {'lat': self.lat, 'lng': self.lng}

    def queue_geocache_update(self):
        django_rq.enqueue(updatePersonGeo, self.id)

    def save(self, *args, **kwargs):
        if not self.address_id:
            self.address = Address.objects.create()
        if not self.state_id:
            self.state = PersonState.objects.get_or_create(name=settings.DEFAULT_PERSON_STATE)[0]
        runUpdate = kwargs.pop('_updateGeocache', True)
        super(Person, self).save(*args, **kwargs)
        if runUpdate:
            self.queue_geocache_update()

    @property
    def current_turf(self):
        return Turf.objects.get(pk=self.current_turf_id)

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

    def __unicode__(self):
        return "%s -> %s"%(self.person, self.turf)
