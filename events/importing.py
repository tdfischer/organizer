from django.conf import settings
from airtable import Airtable
from events.models import Event
from googleapiclient.discovery import build
from httplib2 import Http
import json
import argparse
from oauth2client import client, tools, service_account
from crm.importing import DatasetImporter, AddressWidget
from crm.models import Person
from datetime import timedelta
from django.utils import timezone
from import_export import resources, widgets, fields, instance_loaders
import tablib
from address.models import Address
import dateutil.parser
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

class TimezoneAwareDateTimeWidget(widgets.Widget):
    def clean(self, value, row, *args, **kwargs):
        if value is None:
            return None
        else:
            return dateutil.parser.parse(value)

    def render(self, value, obj=None):
        return value.isoformat()

class EventResource(resources.ModelResource):
    timestamp = fields.Field(
        column_name = 'timestamp',
        attribute = 'timestamp',
        widget = TimezoneAwareDateTimeWidget()
    )
    location = fields.Field(
        column_name = 'location',
        attribute = 'location',
        widget = AddressWidget()
    )

    def skip_row(self, instance, previous):
        if instance.location is None:
            return True
        if instance.timestamp is None:
            return True
        return super(EventResource, self).skip_row(instance, previous)

    class Meta:
        model = Event
        import_id_fields = ('uid', 'instance_id')
        report_skipped = True
        skip_unchanged = True
        fields = ('uid', 'instance_id', 'timestamp', 'location')

class GoogleCalendarImporter(DatasetImporter):
    class Meta:
        resource = EventResource()

    def __init__(self):
        super(GoogleCalendarImporter, self).__init__()

    def init(self):
        self.eventPages = iter(self.get_google_events())

    def get_creds(self):
        #FIXME: Error out if credentials aren't set, and load google app engine
        # default creds
        keyfileDict = json.loads(settings.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
        creds = service_account.ServiceAccountCredentials.from_json_keyfile_dict(keyfileDict,
                scopes=SCOPES)
        if not creds or creds.invalid:
            # FIXME: Implement some notification of invalid creds, with
            # instructions on how to fix
            raise ImproperlyConfigured()
        return creds

    def get_google_events(self):
        ret = []
        token = None
        while True:
            creds = self.get_creds()
            service = build('calendar', 'v3', http=creds.authorize(Http()))

            # Call the Calendar API
            events_result = service.events().list(
                    calendarId=settings.GOOGLE_CALENDAR_IMPORT_ID,
                    singleEvents=True,
                    pageToken=token,
                    maxResults=100,
                    # TODO: Make these two values configurable, or at least an
                    # option to import specific events
                    timeMax=(timezone.now() + timedelta(days=365*5)).isoformat(),
                    timeMin=(timezone.now() - timedelta(days=30)).isoformat(),
                    orderBy='startTime').execute()
            yield events_result.get('items', [])
            token = events_result.get('nextPageToken')
            if token is None:
                break

    def next_page(self):
        dataset = tablib.Dataset(headers=('uid', 'instance_id', 'timestamp', 'name', 'location'))
        for event in self.eventPages.next():
            timestamp = event.get('start').get('dateTime')
            name = event.get('summary')
            location = event.get('location')
            icalUID = event.get('iCalUID')
            dataset.append((
                icalUID,
                event.get('id'),
                timestamp,
                name,
                location
            ))
        return dataset

class PartialMatchModelInstanceLoader(instance_loaders.ModelInstanceLoader):
    def get_instance(self, row):
        query = {}
        for key in self.resource.get_import_id_fields():
            field = self.resource.fields[key]
            if row.get(field.column_name) is not None:
                query[field.attribute] = field.clean(row)
        return self.get_queryset().filter(**query).first()

class AppendingField(fields.Field):
    def save(self, obj, data, is_m2m=False):
        if not self.readonly:
            attrs = self.attribute.split('__')
            for attr in attrs[:-1]:
                obj = getattr(obj, attr, None)
            cleaned = self.clean(data)
            if cleaned is not None or self.saves_null_values:
                if not is_m2m:
                    setattr(obj, attrs[-1], cleaned)
                else:
                    getattr(obj, attrs[-1]).add(*list(cleaned))

class EventAttendanceResource(resources.ModelResource):
    email = AppendingField(column_name='email', attribute='attendees',
            widget=widgets.ManyToManyWidget(Person, ',', 'email'))
    event_uid = fields.Field(column_name='event_uid', attribute='uid',
            widget=widgets.CharWidget(), saves_null_values=False)
    event_instance_id = fields.Field(column_name='event_instance_id',
            attribute='instance_id', widget=widgets.CharWidget(),
            saves_null_values=False)

    def skip_row(self, instance, previous):
        if instance.uid is None:
            return True
        return super(EventAttendanceResource, self).skip_row(instance, previous)

    class Meta:
        model = Event
        instance_loader_class = PartialMatchModelInstanceLoader
        import_id_fields = ('event_uid', 'event_instance_id')
        fields = ('uid', 'instance_id', 'attendees')

class AirtableAttendanceImporter(DatasetImporter):
    class Meta:
        resource = EventAttendanceResource()

    def __init__(self):
        super(AirtableAttendanceImporter, self).__init__()

    def init(self):
        membersTable = Airtable(
                settings.AIRTABLE_BASE_ID,
                settings.AIRTABLE_TABLE_NAME,
                api_key=settings.AIRTABLE_API_KEY)
        eventsTable = Airtable(
                settings.AIRTABLE_BASE_ID,
                'Events',
                api_key=settings.AIRTABLE_API_KEY)
        self.eventPages = iter(eventsTable.get_iter(fields=['Name', 'Date/Time', 'Google Calendar ID', 'Volunteers']))
        members = iter(membersTable.get_all(fields=['Email', 'Name']))

        self.emailForAirtableId = {}

        for member in members:
            self.emailForAirtableId[member['id']] = member['fields'].get('Email')


    def next_page(self):
        dataset = tablib.Dataset(headers=('email', 'event_uid', 'event_instance_id'))
        for event in self.eventPages.next():
            #FIXME: These field names are hardcoded
            if 'Volunteers' in event['fields']:
                for attendee in event['fields']['Volunteers']:
                    dataset.append((
                        self.emailForAirtableId.get(attendee),
                        None, # FIXME: Support GUID column
                        event['fields'].get('Google Calendar ID')
                    ))
        return dataset

importers = {
    'google-calendar-events': GoogleCalendarImporter,
    'airtable-attendance': AirtableAttendanceImporter
}
