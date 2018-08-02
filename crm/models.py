# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.utils import timezone
from django.urls import reverse
from address.models import AddressField, Address, Locality
from enumfields import EnumIntegerField, Enum
from taggit.managers import TaggableManager
import inspect

class Person(models.Model):
    name = models.CharField(max_length=200)
    email = models.CharField(max_length=200)
    address = AddressField(blank=True)
    created = models.DateTimeField(auto_now_add=True)
    lat = models.FloatField(null=True)
    lng = models.FloatField(null=True)

    tags = TaggableManager()

    def save(self, *args, **kwargs):
        if not self.address_id:
            self.address = Address.objects.create()
        super(Person, self).save(*args, **kwargs)

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
    person = models.ForeignKey(Person, related_name='turf_memberships')
    turf = models.ForeignKey(Turf, related_name='members')
    joined_on = models.DateField()
    is_captain = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.id:
            self.joined_on = timezone.now()
        return super(TurfMembership, self).save(*args, **kwargs)
