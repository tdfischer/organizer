from django.core.management.base import BaseCommand
from events.importing import GoogleCalendarImporter

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        importer = GoogleCalendarImporter()
        for evt in importer:
            event, created = evt
            if created:
                print "New event:", event
            else:
                print "Updated event:", event
