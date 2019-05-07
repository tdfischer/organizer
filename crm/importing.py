import logging
import csv
from . import models
from geopy.geocoders import GoogleV3
from django.conf import settings
import itertools
from airtable import Airtable
from import_export import resources, fields, widgets
import tablib
from address.models import Address
from organizer.importing import DatasetImporter, AddressWidget
from mailchimp3 import MailChimp


class PersonResource(resources.ModelResource):
    address = fields.Field(
        column_name = 'address',
        attribute = 'address',
        widget=AddressWidget(),
        saves_null_values = False
    )

    def skip_row(self, instance, previous):
        if instance.email is None:
            return True
        return super(PersonResource, self).skip_row(instance, previous)

    class Meta:
        model = models.Person
        import_id_fields = ('email',)
        fields = ('email', 'name', 'address')
        report_skipped = True
        skip_unchanged = True

class AirtableImporter(DatasetImporter):
    class Meta:
        resource = PersonResource()

    def __init__(self):
        super(AirtableImporter, self).__init__()
        self.__airtable = Airtable(
                settings.AIRTABLE_BASE_ID,
                settings.AIRTABLE_TABLE_NAME,
                api_key=settings.AIRTABLE_API_KEY)

    def init(self):
        self.__pages = self.__airtable.get_iter()

    def next_page(self):
        #FIXME: These field names are hardcoded, very EBFE specific
        COLUMNMAP = dict(
            email = settings.AIRTABLE_EMAIL_COLUMN,
            name = settings.AIRTABLE_NAME_COLUMN,
            address = settings.AIRTABLE_ADDRESS_COLUMN,
        )
        ret = tablib.Dataset(headers=COLUMNMAP.keys())
        page = self.__pages.next()
        for row in page:
            rowData = ()
            for importKey, airtableKey in COLUMNMAP.iteritems():
                rowData += (row['fields'].get(airtableKey),)
            ret.append(rowData)
        return ret

class MailchimpImporter(DatasetImporter):
    class Meta:
        resource = PersonResource()

    def __init__(self):
        super(MailchimpImporter, self).__init__()
        self.mailchimp = MailChimp(mc_api=settings.MAILCHIMP_SECRET_KEY)
        self.page = 0
        self.pageSize = 100

    def init(self):
        self.totalMembers = self.mailchimp.lists.get(settings.MAILCHIMP_LIST_ID)['stats']['member_count']

    def __len__(self):
        return self.totalMembers / self.pageSize

    def next_page(self):
        #FIXME: These field names are hardcoded
        COLUMNMAP = dict(
            email = ['email_address'],
            name = ['merge_fields.FNAME', 'merge_fields.LNAME'],
        )
        dataset = tablib.Dataset(headers=COLUMNMAP.keys())
        page = self.mailchimp.lists.members.all(settings.MAILCHIMP_LIST_ID, count=self.pageSize,
                offset=self.page*self.pageSize)
        self.page += 1
        if len(page['members']) == 0:
            raise StopIteration()
        for person in page['members']:
            obj = ()
            for fieldNames in COLUMNMAP.values():
                props = ()
                for fieldName in fieldNames:
                    prop = person
                    for p in fieldName.split('.'):
                        prop = prop.get(p, {})
                    props += (prop,)
                obj += (' '.join(props),)
            dataset.append(obj)
        return dataset

importers = {
    'airtable-people': AirtableImporter,
    'mailchimp-people': MailchimpImporter
}
