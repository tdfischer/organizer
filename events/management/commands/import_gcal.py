from django.core.management.base import BaseCommand
import datetime
from apiclient.discovery import build
from httplib2 import Http
from oauth2client import file as oauth_file, client, tools
import argparse


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        store = oauth_file.Storage('./token.json')
        creds = store.get()
        if not creds or creds.invalid:
            flow = client.flow_from_clientsecrets('credentials.json', SCOPES)
            args = argparse.ArgumentParser(parents=[tools.argparser]).parse_args([])
            creds = tools.run_flow(flow, store, args)
        service = build('calendar', 'v3', http=creds.authorize(Http()))

        # Call the Calendar API
        print('Getting the upcoming 10 events')
        events_result = service.events().list(
                calendarId='t2ciqseie8d6177ei9qi9q2lvo@group.calendar.google.com',
                singleEvents=True,
                orderBy='startTime').execute()
        events = events_result.get('items', [])

        if not events:
            print('No upcoming events found.')
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            print(start, event['summary'])
