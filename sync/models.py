# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.contrib.auth.models import User
import json
from organizer.importing import get_importer_class

#FIXME: This only supports importing data, no exporting or full sync is implemented yet
class ImportSource(models.Model):
    name = models.CharField(max_length=255)
    backend = models.CharField(max_length=255)
    enabled = models.BooleanField(default=False)
    configuration = models.TextField(blank=True, null=True)
    lastRun = models.DateTimeField(blank=True, null=True)

    def make_importer(self):
        importCls = get_importer_class(self.backend)
        return importCls(json.loads(self.configuration))

    def __unicode__(self):
        return '%s: %s' % (self.name, self.backend)
