from django.conf import settings
from airtable import Airtable
import logging

from organizer.exporting import DatasetExporter
from crm.importing import PersonResource

log = logging.getLogger(__name__)

class AirtableExporter(DatasetExporter):
    class Meta:
        resource = PersonResource
        #page_size = 1

    def init(self):
        self.airtable = Airtable(
                settings.AIRTABLE_BASE_ID,
                settings.AIRTABLE_TABLE_NAME,
                api_key=settings.AIRTABLE_API_KEY)
        self.members = self.airtable.get_all()

    def export_page(self, page, dry_run=False):
        for row in page.dict:
            self.export_person(row, dry_run=dry_run)

    def export_person(self, row, dry_run):
        rowEmail = row['email'].strip().lower()
        rowState = row['state']
        for m in self.members:
            memberEmail = m['fields'].get('Email', '').strip().lower()
            memberState = m['fields'].get('Membership Basis', '')
            if memberEmail == rowEmail:
                if memberState != rowState:
                    log.info("Updating %s: %s -> %s", memberEmail, memberState, rowState)
                    if not dry_run:
                        self.airtable.update(m['id'], {
                            'Membership Basis': row['state']
                        })
                return
        log.info('Creating %s <%s>: %s', row['name'], row['email'], rowState)
        if not dry_run:
            self.airtable.insert({
                'Name': row['name'],
                'Email': row['email'],
                'Membership Basis': rowState
            })
