from django.core.management.base import BaseCommand
from django.db.models import Count
from django.conf import settings
from airtable import Airtable

from crm import models

COMPUTED_FIELDS = ['Total Donations', 'ID', 'Full Address', 'Donations in last 30 days', 'Current Member', 'Created', 'Event Count', 'Voting Member', 'Events in last 12 months']

class Command(BaseCommand):
    def handle(self, *args, **options):
        airtable = Airtable(
                settings.AIRTABLE_BASE_ID,
                settings.AIRTABLE_TABLE_NAME,
                api_key=settings.AIRTABLE_API_KEY)
        members = airtable.get_all()
        by_email = {}
        by_name = {}
        for m in members:
            email = m['fields'].get('Email', '').strip().lower()
            name = m['fields'].get('Name', '').strip().lower()
            by_email[email] = by_email.get(email, ()) + (m,)
            by_name[name] = by_name.get(name, ()) + (m,)
        allDupes = list(by_email.iteritems()) + list(by_name.iteritems())
        for (email, rows) in allDupes:
            if len(email) == 0:
                continue
            if len(rows) > 1:
                print '%s:'%(email)
                idx = 1
                conflictingFields = []
                for r in rows:
                    for (fieldName, fieldValue) in r['fields'].iteritems():
                        for row in rows:
                            if fieldName not in COMPUTED_FIELDS and row['fields'].get(fieldName) != fieldValue:
                                conflictingFields.append(fieldName)
                for row in rows:
                    print "\t%s"%(idx)
                    for fieldName in set(conflictingFields):
                        fieldPad = ' ' * (25 - len(fieldName))
                        print "\t\t%s:%s%s"%(fieldName, fieldPad, row['fields'].get(fieldName))
                    idx += 1
                chosenIdx = input("Select the row to save, enter 0 to skip: ")

                if chosenIdx == 0:
                    continue

                i = 0
                deleted = []
                merged = {}
                for f in set(conflictingFields):
                    merged[f] = rows[chosenIdx-1]['fields'].get(f, None)
                for row in rows:
                    if i != chosenIdx - 1:
                        for f in set(conflictingFields):
                            curVal = merged.get(f, None)
                            if curVal is None or curVal == '':
                                merged[f] = row['fields'].get(f, curVal)
                            if type(curVal) is list:
                                merged[f] += row['fields'].get(f, [])
                        deleted.append(row['id'])
                    i += 1
                print "\tmerged:"
                for fieldName in set(conflictingFields):
                    fieldPad = ' ' * (25 - len(fieldName))
                    print "\t\t%s:%s%s"%(fieldName, fieldPad, merged.get(fieldName))
                doCommit = raw_input("Commit? [N/y]")
                if doCommit is None:
                    continue
                if doCommit.strip().lower() == "y":
                    airtable.batch_delete(deleted)
                    airtable.update(rows[chosenIdx-1]['id'], merged)
                    pass
