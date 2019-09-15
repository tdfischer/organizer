# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.apps import AppConfig

class SyncConfig(AppConfig):
    name = 'sync'

    def ready(self):
        from organizer.importing import DatasetImporter
        DatasetImporter.import_plugins()
