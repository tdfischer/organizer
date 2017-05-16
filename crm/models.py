# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.db.models import Count, Subquery, OuterRef
from django.urls import reverse
from address.models import AddressField
from enumfields import EnumIntegerField, Enum
from taggit.managers import TaggableManager
import inspect

class Person(models.Model):
    name = models.CharField(max_length=200)
    email = models.CharField(max_length=200)
    address = AddressField(blank=True)
    created = models.DateTimeField(auto_now_add=True)

    tags = TaggableManager()

    def __unicode__(self):
        ret = self.name.strip()
        if len(ret) == 0:
            return self.email
        return ret
