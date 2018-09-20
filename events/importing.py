from django.conf import settings
from events.models import Event
from googleapiclient.discovery import build
from httplib2 import Http
import json
import argparse
from oauth2client import client, tools, service_account
from crm.importing import DatasetImporter, LocationAliasWidget
from crm.models import Person
from datetime import timedelta
from django.utils import timezone, dateparse
from import_export import resources, widgets, fields, instance_loaders
import tablib
import dateutil.parser
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
import pytz
import logging
import requests
from django import forms

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
    end_timestamp = fields.Field(
        column_name = 'end_timestamp',
        attribute = 'end_timestamp',
        widget = TimezoneAwareDateTimeWidget()
    )
    location = fields.Field(
        column_name = 'location',
        attribute = 'location',
        widget = LocationAliasWidget()
    )

    def skip_row(self, instance, previous):
        if instance.location is None:
            return True
        if instance.timestamp is None or instance.end_timestamp is None:
            return True
        return super(EventResource, self).skip_row(instance, previous)

    class Meta:
        model = Event
        import_id_fields = ('uid', 'instance_id')
        report_skipped = True
        skip_unchanged = True
        fields = ('uid', 'name', 'instance_id', 'timestamp', 'end_timestamp', 'location')

class GoogleCalendarImportForm(forms.Form):
    calendar_id = forms.ChoiceField()

class GoogleCalendarImporter(DatasetImporter):
    class Meta:
        resource = EventResource()

    def __init__(self, *args, **kwargs):
        super(GoogleCalendarImporter, self).__init__(*args, **kwargs)
        self.log = logging.getLogger(__name__ + '.google')

    def init(self):
        self.eventPages = iter(self.get_google_events())

    def options_form(self, *args, **kwargs):
        form = GoogleCalendarImportForm(*args, **kwargs)
        creds = self.get_creds()
        service = build('calendar', 'v3', http=creds.authorize(Http()))
        calendars = service.calendarList().list().execute()
        keyfileDict = json.loads(settings.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
        authEmail = keyfileDict['client_email']
        form.fields['calendar_id'].help_text = "Not seeing a calendar? Share it with %s"%authEmail
        calendarChoices = []
        for calendar in calendars['items']:
            calendarChoices.append((calendar['id'], calendar['summary']))
        form.fields['calendar_id'].choices = calendarChoices
        return form

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
            self.log.debug('Starting page!')
            events_result = service.events().list(
                    calendarId=self.configuration['calendar_id'],
                    singleEvents=True,
                    pageToken=token,
                    maxResults=100,
                    # TODO: Make these two values configurable, or at least an
                    # option to import specific events
                    timeMax=(timezone.now() + timedelta(days=365*5)).isoformat(),
                    timeMin=(timezone.now() - timedelta(days=30)).isoformat(),
                    orderBy='startTime').execute()
            self.log.debug('Fetched %s items', len(events_result.get('items',
                [])))
            yield events_result.get('items', [])
            token = events_result.get('nextPageToken')
            if token is None:
                self.log.debug('End of events!')
                break

    def grab_datetime(self, data):
        this_timestamp = dateparse.parse_datetime(data.get('dateTime'))
        this_timezone = data.get('timeZone')
        if this_timezone is None or timezone.is_aware(this_timestamp):
            return this_timestamp.isoformat()
        else:
            return timezone.make_aware(this_timestamp,
                    pytz.timezone(this_timezone)).isoformat()

    def next_page(self):
        dataset = tablib.Dataset(headers=('uid', 'instance_id', 'timestamp',
        'end_timestamp', 'name', 'location'))
        for event in self.eventPages.next():
            try:
                timestamp = self.grab_datetime(event.get('start'))
                end_timestamp = self.grab_datetime(event.get('end'))
            except:
                continue
            name = event.get('summary')
            location = event.get('location')
            icalUID = event.get('iCalUID')
            self.log.debug('Found event %r', (icalUID, event.get('id'), timestamp,
                end_timestamp, name, location))
            dataset.append((
                icalUID,
                event.get('id'),
                timestamp,
                end_timestamp,
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
            widget=widgets.ManyToManyWidget(Person, ',', 'email'),
            saves_null_values=False)
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

importers = {
    'google-calendar-events': GoogleCalendarImporter,
}
