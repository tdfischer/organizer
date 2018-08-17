from django.conf import settings
from airtable import Airtable
from icalendar import Calendar
from events.models import Event
from googleapiclient.discovery import build
from httplib2 import Http
import json
import argparse
from oauth2client import client, tools, service_account
from crm.importing import Importer
from crm.models import Person
from datetime import timedelta
from django.utils import timezone

SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'


class ICalImporter(Importer):
    def __init__(self, calStream):
        super(self, ICalImporter).__init__()
        self.input = input
        cal = Calendar.from_ical(self.input.read())
        self.components = iter(cal.walk())

    def import_next(self):
        while True:
            component = self.components.next()
            if component.name == 'VEVENT':
                return Event.objects.update_or_create(
                        uid = component.get('uid'),
                        defaults={
                            'name': component.get('SUMMARY'),
                            'timestamp': component.get('DTSTART').dt,
                            'location': component.get('LOCATION')
                        }
                )

class GoogleCalendarImporter(Importer):
    def __init__(self):
        super(GoogleCalendarImporter, self).__init__()
        self.events = iter(self.get_google_events())

    def get_creds(self):
        #FIXME: Error out if credentials aren't set, and load google app engine
        # default creds
        keyfileDict = json.loads(settings.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
        creds = service_account.ServiceAccountCredentials.from_json_keyfile_dict(keyfileDict,
                scopes=SCOPES)
        if not creds or creds.invalid:
            # FIXME: Implement some notification of invalid creds
            flow = client.OAuth2WebServerFlow(
                client_id = '',
                client_secret = '',
                scope = SCOPES,
                redirect_uri = ''
            )
            args = argparse.ArgumentParser(parents=[tools.argparser]).parse_args([])
            creds = tools.run_flow(flow, store, args)
        return creds

    def get_google_events(self):
        ret = []
        token = None
        while True:
            creds = self.get_creds()
            service = build('calendar', 'v3', http=creds.authorize(Http()))

            # Call the Calendar API
            events_result = service.events().list(
                    calendarId='t2ciqseie8d6177ei9qi9q2lvo@group.calendar.google.com',
                    singleEvents=True,
                    pageToken=token,
                    maxResults=2500,
                    timeMax=(timezone.now() + timedelta(days=365*5)).isoformat(),
                    orderBy='startTime').execute()
            ret += events_result.get('items', [])
            token = events_result.get('nextPageToken')
            if token is None:
                return ret

    def import_next(self):
        event = self.events.next()
        timestamp = event.get('start').get('dateTime')
        name = event.get('summary')
        location = event.get('location')
        icalUID = event.get('iCalUID')
        if timestamp is None:
            print "Could not grab timestamp for event", event
            return self.import_next()
        return Event.objects.update_or_create(
            uid = icalUID,
            instance_id = event.get('id'),
            defaults = dict(
                timestamp = timestamp,
                name = name,
                location = location
            )
        )

class AirtableImporter(Importer):
    def __init__(self):
        super(AirtableImporter, self).__init__()
        membersTable = Airtable(
                settings.AIRTABLE_BASE_ID,
                settings.AIRTABLE_TABLE_NAME,
                api_key=settings.AIRTABLE_API_KEY)
        eventsTable = Airtable(
                settings.AIRTABLE_BASE_ID,
                'Events',
                api_key=settings.AIRTABLE_API_KEY)
        self.events = iter(eventsTable.get_all(fields=['Name', 'Date/Time', 'Google Calendar ID', 'Volunteers']))
        members = iter(membersTable.get_all(fields=['Email', 'Name']))

        self.emailForAirtableId = {}

        for member in members:
            if 'Email' not in member['fields']:
                print "Missing email on", member
                continue
            self.emailForAirtableId[member['id']] = member['fields'].get('Email')


    def import_next(self):
        event = self.events.next()
        if 'Volunteers' in event['fields']:
            eventObj = None
            try:
                eventObj = Event.objects.get(instance_id = event['fields'].get('Google Calendar ID'))
            except:
                print "Could not find existing event for", event
                return self.import_next()
            for attendee in event['fields']['Volunteers']:
                email = self.emailForAirtableId.get(attendee)
                person, _ = Person.objects.get_or_create(email=email)
                if not eventObj.attendees.filter(pk=person.pk).exists():
                    eventObj.attendees.add(person)
            eventObj.save()
            return (eventObj, True)
        else:
            return self.import_next()
