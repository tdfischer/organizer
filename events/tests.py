# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.test import TestCase

from . import importing
from mock import patch

def testAirtableAttendanceImports():
    with patch('events.importing.Airtable') as Airtable:
        Airtable.return_value = Airtable
        Airtable.get_all.return_value = [
            dict(id='0', fields=dict(Email='0@example.com')),
            dict(id='1', fields=dict(Email='1@example.com')),
            dict(id='2', fields=dict(Email='2@example.com'))
        ]
        Airtable.get_iter.return_value = [[
            {'fields': {
                'Volunteers': ['0', '1', '2'],
                'Google Calendar ID': 'event-0'
            }},
            {'fields': {
                'Volunteers': ['0'],
                'Google Calendar ID': 'event-1'
            }},
            {'fields': {
                'Volunteers': ['1', '2'],
                'Google Calendar ID': 'event-2'
            }},
        ]]
        importer = importing.AirtableAttendanceImporter()
        importer.init()
        page = importer.next_page()
        assert(page[0][0] == '0@example.com')
        assert(page[0][2] == 'event-0')
        assert(page[1][0] == '1@example.com')
        assert(page[1][2] == 'event-0')
        assert(page[2][0] == '2@example.com')
        assert(page[2][2] == 'event-0')

def testGoogleEventImports():
    with patch('events.importing.GoogleCalendarImporter.get_google_events') as get_google_events:
        get_google_events.return_value = iter([])
        importer = importing.GoogleCalendarImporter()
        importer.init()
        for page in importer:
            pass
