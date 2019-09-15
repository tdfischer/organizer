# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.apps import AppConfig

class SyncConfig(AppConfig):
    name = 'sync'

    def ready(self):
        from organizer.importing import DatasetImporter
        from organizer.exporting import DatasetExporter
        DatasetImporter.import_plugins()
        DatasetExporter.import_plugins()
