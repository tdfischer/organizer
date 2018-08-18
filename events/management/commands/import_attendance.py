from django.core.management.base import BaseCommand
from events.importing import AirtableImporter

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        importer = AirtableImporter()
        for (attendance, created) in importer:
            if created:
                print "New attendance:", attendance
