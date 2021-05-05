# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from crm.models import Person

class Donation(models.Model):
    person = models.ForeignKey(Person, related_name='donations', on_delete=models.CASCADE)
    timestamp = models.DateTimeField()
    value = models.IntegerField()
    transaction_id = models.CharField(max_length=200, blank=True)
    recurring = models.BooleanField()

    def __unicode__(self):
        return "${0} from {1}".format(self.value / 100.0, self.person)
