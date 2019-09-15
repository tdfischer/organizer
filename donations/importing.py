import logging
from . import models
from crm.models import Person
from django.conf import settings
from airtable import Airtable
from import_export import resources, fields, widgets
from organizer.importing import DatasetImporter
import tablib
import stripe
from datetime import datetime

class PersonEmailWidget(widgets.Widget):
    def clean(self, value, row, *args, **kwargs):
        if value is None:
            return None
        ret, _ = Person.objects.get_or_create(email=value)
        return ret

    def render(self, value, obj=None):
        if value is None:
            return None
        return value.email

class DonationResource(resources.ModelResource):
    email = fields.Field(column_name='email', attribute='person', widget=PersonEmailWidget())

    class Meta:
        model = models.Donation
        fields = ('transaction_id', 'email', 'value', 'timestamp', 'recurring')
        import_id_fields = ('transaction_id',)
        report_skipped = True
        skup_unchanged = True

class DonorboxImporter(DatasetImporter):
    name = 'donorbox-donations'
    class Meta:
        resource = DonationResource()

    def init(self):
        self.__finished = False
        self.__offset = None
        stripe.api_key = settings.STRIPE_KEY

    def next_page(self):
        if self.__finished:
            raise StopIteration()

        HEADERS = (
            'transaction_id', 'email', 'value', 'timestamp', 'recurring'
        )
        ret = tablib.Dataset(headers=HEADERS)
        page = stripe.Charge.list(limit=10, starting_after=self.__offset)
        for charge in page['data']:
            if '@' not in charge.metadata.get('donorbox_email', ''):
                continue
            chargeID = charge.id
            isRecurring = charge.metadata['donorbox_recurring_donation']
            email = charge.metadata['donorbox_email']
            ret.append((chargeID, email, charge.amount,
                datetime.utcfromtimestamp(charge.created),
                isRecurring))
            self.__offset = chargeID
        if not page['has_more']:
            self.__finished = True
        return ret
