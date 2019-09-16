from django.conf import settings
from airtable import Airtable
import logging
from mailchimp3 import MailChimp
import hashlib

from organizer.exporting import DatasetExporter
from crm.resources import PersonResource
from crm.forms import MailchimpListSelectionForm, AirtableImportExportForm

log = logging.getLogger(__name__)

class MailchimpExporter(DatasetExporter):
    name = 'mailchimp-people'
    options_form_class = MailchimpListSelectionForm

    class Meta:
        resource = PersonResource

    def init(self):
        self.mailchimp = MailChimp(mc_api=settings.MAILCHIMP_SECRET_KEY)

    def export_page(self, page, dry_run=False):
        for row in page.dict:
            hasher = hashlib.md5()
            hasher.update(row['email'].lower())
            hashedAddr = hasher.hexdigest()
            tags = row['tags']
            if not dry_run:
                self.mailchimp.lists.members.create_or_update(
                    self.configuration['list_id'],
                    hashedAddr,
                    dict(
                        email_address = row['email'],
                        status_if_new = 'subscribed',
                        tags = tags
                    )
                )

class AirtableExporter(DatasetExporter):
    name = 'airtable-people'
    options_form_class = AirtableImportExportForm
    class Meta:
        resource = PersonResource

    def init(self):
        self.airtable = Airtable(
                self.configuration['base_id'],
                self.configuration['table_name'],
                api_key=settings.AIRTABLE_API_KEY)
        self.members = self.airtable.get_all()

    def export_page(self, page, dry_run=False):
        for row in page.dict:
            self.export_person(row, dry_run=dry_run)

    def export_person(self, row, dry_run):
        rowEmail = row['email'].strip().lower()
        for m in self.members:
            memberEmail = m['fields'].get(self.configuration['email_column'], '').strip().lower()
            if memberEmail == rowEmail:
                return
        log.info('Creating %s <%s>', row['name'], row['email'])
        if not dry_run:
            self.airtable.insert({
                self.configuration['name_column']: row['name'],
                self.configuration['email_column']: row['email'],
            })
