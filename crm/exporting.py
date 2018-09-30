from django.conf import settings
from airtable import Airtable
import logging
from mailchimp3 import MailChimp
import hashlib

from organizer.exporting import DatasetExporter
from crm.importing import PersonResource

log = logging.getLogger(__name__)

class MailchimpExporter(DatasetExporter):
    class Meta:
        resource = PersonResource

    def init(self):
        self.mailchimp = MailChimp(mc_api=settings.MAILCHIMP_SECRET_KEY)

    def export_page(self, page, dry_run=False):
        for row in page.dict:
            hasher = hashlib.md5()
            hasher.update(row['email'].lower())
            hashedAddr = hasher.hexdigest()
            if not dry_run:
                self.mailchimp.lists.members.create_or_update(
                    settings.MAILCHIMP_LIST_ID,
                    hashedAddr,
                    dict(
                        email_address = row['email'],
                        status_if_new = 'subscribed'
                    )
                )

class AirtableExporter(DatasetExporter):
    class Meta:
        resource = PersonResource

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
            memberEmail = m['fields'].get(settings.AIRTABLE_EMAIL_COLUMN, '').strip().lower()
            memberState = m['fields'].get(settings.AIRTABLE_STATE_COLUMN, '')
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
                settings.AIRTABLE_NAME_COLUMN: row['name'],
                settings.AIRTABLE_EMAIL_COLUMN: row['email'],
                settings.AIRTABLE_STATE_COLUMN: rowState
            })
