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
import logging

log = logging.getLogger(__name__)

def updatePersonGeo(personID):
    person = Person.objects.get(pk=personID)
    return person.update_geo()

class Person(models.Model):
    name = models.CharField(max_length=200, null=True, blank=True, default='')
    email = models.EmailField(max_length=200, unique=True, db_index=True)
    address = AddressField(blank=True)
    phone = models.CharField(max_length=200, null=True, blank=True, default=None)
    created = models.DateTimeField(auto_now_add=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    is_captain = models.BooleanField(default=False)

    tags = TaggableManager(blank=True)

    @property
    def geo(self):
        city = None
        if self.address is not None and self.address.locality is not None:
            city = self.address.locality.name
        return {'lat': self.lat, 'lng': self.lng, 'city': city}

    def update_geo(self):
        resolved = geocache.geocode(self.address.raw)
        self.address = resolved
        self.lng = resolved.get('lng')
        self.lat = resolved.get('lat')
        self.save(_updateGeocache=False)
        return True

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
        if self.name is None:
            return ""
        ret = self.name.strip()
        if len(ret) == 0:
            return self.email
        return ret

def merge_models(first, *duplicates):
    relations = []
    for field in first._meta.get_fields():
        log.debug("Merging %s", field.name)
        firstValue = getattr(first, field.name)
        if field.many_to_many:
            for dupe in duplicates:
                log.debug("Adding %s: %s", field.name, getattr(dupe,
                    field.name).all())
                firstValue.add(*getattr(dupe, field.name).all())
        elif field.one_to_many:
            for dupe in duplicates:
                dupeValue = getattr(dupe, field.name)
                for dupeRelation in dupeValue.all():
                    log.debug("Remapping related object %s to use %s", dupeRelation,
                            first)
                    setattr(dupeRelation, field.remote_field.name, first)
                    relations.append(dupeRelation)
        else:
            for dupe in duplicates:
                dupeValue = getattr(dupe, field.name)
                if firstValue is None and dupeValue is not None:
                    log.debug("Using %s for %s", dupeValue, field.name)
                    setattr(first, field.name, dupeValue)
    return (first, relations)
