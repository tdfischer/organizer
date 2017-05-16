from django.core.management.base import BaseCommand, CommandError
from crm import importing
import sys

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('source')

    IMPORTERS = {
        'airtable': lambda: importing.AirtableImporter(),
        'csv': lambda: importing.CSVImporter(sys.stdin)
    }

    def handle(self, *args, **options):
        importer = self.IMPORTERS[options['source']]()
        newPeople = []
        updated = []
        importCount = 0
        for person, created in importer:
            importCount += 1
            sys.stdout.write(str(importCount) + "...\r")
            if created:
                newPeople.append(person)
            else:
                updated.append(person)
            sys.stdout.write("\n")
        print str(len(newPeople)) + " new People"
        print str(len(updated)) + " updated People"
