# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from mptt.models import TreeManager, MPTTModel, TreeForeignKey
from enumfields import Enum, EnumField
from . import api
import django_rq
import logging

logger = logging.getLogger(__name__)

@receiver(post_save)
def queueUpdates(sender, instance, **kwargs):
    if sender is LocationAlias and sender.nonce != sender.raw:
        logger.info("Queueing alias resolution for %s", instance)
        django_rq.enqueue(resolveAlias, instance.pk)

def resolveAlias(pk):
    obj = LocationAlias.objects.get(pk=pk)
    if obj.resolve():
        obj.save()
        logger.info("Resolved and saved %s", obj)
    else:
        logger.info("Already resolved %s", obj)

class LocationType(Enum):
    # Copied from google API response domain
    STREET_ADDRESS = 'street_number'
    ROUTE = 'route'
    NEIGHBORHOOD = 'neighborhood'
    LOCALITY = 'locality'
    POSTAL_CODE = 'postal_code'
    STATE = 'administrative_area_level_1'
    COUNTRY = 'country'

class LocationManager(models.Manager):
    def fromResponse(self, response):
        if response is None:
            return None

        if response.get('country') is None:
            return None

        country, _ = self.get_or_create(type=LocationType.COUNTRY,
                name=response['country'])

        if response.get('state') is None:
            country.lat = response['lat']
            country.lng = response['lng']
            country.save()
            return country

        state , _ = self.get_or_create(type=LocationType.STATE,
                name=response['state'], parent=country)

        if response.get('locality') is None:
            state.lat = response['lat']
            state.lng = response['lng']
            state.save()
            return state

        locality , _ = self.get_or_create(type=LocationType.LOCALITY,
                name=response.get('locality'), parent=state)

        if response.get('postal_code') is None:
            locality.lat = response['lat']
            locality.lng = response['lng']
            locality.save()
            return locality

        postal_code , _ = self.get_or_create(type=LocationType.POSTAL_CODE,
                name=response.get('postal_code'), parent=locality)

        if response.get('route') is None and response.get('neighborhood') is None:
            postal_code.lat = response['lat']
            postal_code.lng = response['lng']
            postal_code.save()
            return postal_code

        neighborhood , _ = self.get_or_create(type=LocationType.NEIGHBORHOOD,
                name=response.get('neighborhood'), parent=postal_code)

        if response.get('route') is None:
            neighborhood.lat = response['lat']
            neighborhood.lng = response['lng']
            neighborhood.save()
            return neighborhood

        route, _ = self.get_or_create(type=LocationType.ROUTE,
                name=response.get('route'), parent=neighborhood)

        if response.get('street_number') is None:
            route.lat = response['lat']
            route.lng = response['lng']
            route.save()
            return route

        street_number , _ = self.get_or_create(type=LocationType.STREET_ADDRESS,
                name=response.get('street_number'), parent=route)

        street_number.lat = response['lat']
        street_number.lng = response['lng']
        street_number.save()

        return street_number 

class Location(MPTTModel):
    parent = TreeForeignKey('self', related_name='children', blank=True,
            null=True, on_delete=models.CASCADE)
    type = EnumField(LocationType, max_length=32, null=True, blank=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)

    objects = LocationManager()

    @property
    def geo(self):
        city = None
        locality = self.location.get_ancestors().filter(type=LocationType.LOCALITY)
        if locality.exists():
            city = locality.first().name
        return {'lat': self.lat, 'lng': self.lng, 'city': city}

    def __unicode__(self):
        return '"%s" (%s #%s [%s, %s])'%(self.fullName, self.type, self.pk, self.lat, self.lng)

    @property
    def fullName(self):
        if self.name is None:
            return ''
        if self.type == LocationType.STREET_ADDRESS:
            return self.name + " " + self.parent.fullName
        elif self.type == LocationType.POSTAL_CODE:
            return self.parent.fullName + ", " + self.name
        elif self.parent is None:
            return self.name
        else:
            return self.name + ", " + self.parent.fullName

class LocationAliasManager(models.Manager):
    def fromRaw(self, raw):
        ret, _ = self.get_or_create(raw=raw)
        return ret

class LocationAlias(models.Model):
    location = models.ForeignKey(Location, related_name='aliases', null=True,
            blank=True, on_delete=models.CASCADE)
    raw = models.CharField(max_length=200, blank=True, default='')
    nonce = models.CharField(max_length=200, blank=True, default='')

    objects = LocationAliasManager()

    def __unicode__(self):
        return "%s -> %s"%(self.raw, self.location)

    def resolve(self):
        if self.nonce != self.raw:
            resolved = api.geocode(self.raw)
            self.location = Location.objects.fromResponse(resolved)
            if self.location is not None:
                logger.info("Resolved alias %r to %r", self, self.location)
            else:
                logger.info("Could not resolve alias %r to a location", self)
            self.nonce = self.raw
            return True
        return False

    @property
    def fullName(self):
        if self.location:
            return self.location.fullName
        else:
            return self.raw

    @property
    def geo(self):
        if self.location:
            return self.location.geo
        else:
            return None

    @property
    def lng(self):
        if self.location:
            return self.location.lng
        else:
            return None

    @property
    def lat(self):
        if self.location:
            return self.location.lat
        else:
            return None

    def __unicode__(self):
        return '%s #%s -> %r' % (self.raw, self.pk, self.location)
