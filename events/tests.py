# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.test import TestCase

from . import importing
from mock import patch

def testGoogleEventImports():
    with patch('events.importing.GoogleCalendarImporter.get_google_events') as get_google_events:
        get_google_events.return_value = iter([])
        importer = importing.GoogleCalendarImporter({})
        importer.init()
        for page in importer:
            pass
