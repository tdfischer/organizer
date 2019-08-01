import logging
import csv
from . import models
from geopy.geocoders import GoogleV3
from django.conf import settings
import itertools
from airtable import Airtable
from import_export import resources, fields, widgets
import tablib
from organizer.importing import DatasetImporter, LocationAliasWidget
from mailchimp3 import MailChimp
from django import forms
import requests

class CommaSeparatedListWidget(widgets.Widget):
    def clean(self, value, row=None, *args, **kwargs):
        return value.split(',')

    def render(self, obj = None, *args, **kwargs):
        try:
            i = iter(obj)
        except TypeError:
            return ''
        return ','.join(i)

class TagField(fields.Field):
    def export(self, obj):
        return obj.tags.names()

    def save(self, obj, data, is_m2m=False):
        print "Adding %s to %s"%(data, obj)
        obj.tags.add(data['tags'])

class PersonResource(resources.ModelResource):
    location = fields.Field(
        column_name = 'location',
        attribute = 'location',
        widget=LocationAliasWidget(),
        saves_null_values = False
    )

    tags = TagField(
        column_name = 'tags',
        attribute = 'tags',
        widget=CommaSeparatedListWidget(),
        saves_null_values=False
    )

    def skip_row(self, instance, previous):
        if instance.email is None:
            return True
        return super(PersonResource, self).skip_row(instance, previous)

    class Meta:
        model = models.Person
        import_id_fields = ('email',)
        fields = ('email', 'name', 'location', 'tags')
        report_skipped = True
        skip_unchanged = True

class TypeformImportForm(forms.Form):
    form_id = forms.ChoiceField()
    email_field = forms.ChoiceField(disabled=True)
    name_field = forms.ChoiceField(disabled=True)
    tags = forms.CharField()

    def __init__(self, *args, **kwargs):
        super(TypeformImportForm, self).__init__(*args, **kwargs)
        headers = {
            'Authorization': 'bearer %s'%(settings.TYPEFORM_ACCESS_TOKEN)
        }
        allForms = requests.get('https://api.typeform.com/forms',
                headers=headers).json()['items']
        formChoices = []
        fieldChoices = []
        for form in allForms:
            formChoices.append((form['id'], form['title']))
        self.fields['form_id'].choices = formChoices
        currentID = self.fields['form_id'].widget.value_from_datadict(self.data,
                self.files, self.add_prefix('form_id'))
        if currentID is None:
            currentID = self['form_id'].initial
        if currentID is not None:
            formFields = requests.get('https://api.typeform.com/forms/%s'%(currentID),
                    headers=headers).json()['fields']
            for field in formFields:
                fieldChoices.append((field['id'], field['title']))
            self.fields['email_field'].disabled = False
            self.fields['name_field'].disabled = False
        else:
            self.fields['email_field'].help_text = "Select a form first"
            self.fields['name_field'].help_text = "Select a form first"
        self.fields['email_field'].choices = fieldChoices
        self.fields['name_field'].choices = fieldChoices

class TypeformImporter(DatasetImporter):
    class Meta:
        resource = PersonResource()

    def init(self):
        self.nextToken = None
        self.finished = False
        self.headers = {
            'Authorization': 'bearer %s'%(settings.TYPEFORM_ACCESS_TOKEN)
        }

    def next_page(self):
        if self.finished:
            raise StopIteration()
        COLUMNMAP = {
            'email': self.configuration['email_field'],
            'name': self.configuration['name_field']
        }
        dataset = tablib.Dataset(headers=COLUMNMAP.keys() + ['tags',])
        url = 'https://api.typeform.com/forms/%s/responses?completed=true&fields=%s' % (self.configuration['form_id'], ','.join(COLUMNMAP.values()))
        if self.nextToken is None:
            responses = requests.get(url,
                    headers=self.headers).json()
        else:
            url += '&before=%s' % (self.nextToken)
            responses = requests.get(url,
                    headers=self.headers).json()
        lastToken = None
        for response in responses['items']:
            fieldValues = {}
            for answer in response.get('answers'):
                fieldValues[answer['field']['id']] = answer.get('email', answer.get('text'))
            obj = ()
            for fieldID in COLUMNMAP.values():
                obj += (fieldValues.get(fieldID), )
            obj += (self.configuration['tags'],)
            dataset.append(obj)
            lastToken = response['token']
        if lastToken == self.nextToken or lastToken is None:
            self.finished = True
        self.nextToken = lastToken
        return dataset

    def options_form(self, *args, **kwargs):
        return TypeformImportForm(*args, **kwargs)

class AirtableImporterForm(forms.Form):
    base_id = forms.CharField()
    table_name = forms.CharField()
    email_column = forms.CharField()
    name_column = forms.CharField()
    address_column = forms.CharField()

class AirtableImporter(DatasetImporter):
    class Meta:
        resource = PersonResource()

    def init(self):
        self.__airtable = Airtable(
                self.configuration['base_id'],
                self.configuration['table_name'],
                api_key=settings.AIRTABLE_API_KEY)
        self.__pages = self.__airtable.get_iter()

    def options_form(self, *args, **kwargs):
        return AirtableImporterForm(*args, **kwargs)

    def next_page(self):
        #FIXME: These field names are hardcoded, very EBFE specific
        COLUMNMAP = dict(
            email = self.configuration['email_column'],
            name = self.configuration['name_column'],
            address = self.configuration['address_column']
        )
        ret = tablib.Dataset(headers=COLUMNMAP.keys())
        page = self.__pages.next()
        for row in page:
            rowData = ()
            for importKey, airtableKey in COLUMNMAP.iteritems():
                rowData += (row['fields'].get(airtableKey),)
            ret.append(rowData)
        return ret

class MailchimpImporterForm(forms.Form):
    list_id = forms.ChoiceField(required=True)

    def __init__(self, *args, **kwargs):
        super(MailchimpImporterForm, self).__init__(*args, **kwargs)
        mailchimp = MailChimp(mc_api=settings.MAILCHIMP_SECRET_KEY)
        lists = mailchimp.lists.all()
        choices = []
        for l in lists['lists']:
            choices.append((l['id'], l['name']))
        self.fields['list_id'].choices = choices

class MailchimpImporter(DatasetImporter):
    class Meta:
        resource = PersonResource()

    def __init__(self, *args, **kwargs):
        super(MailchimpImporter, self).__init__(*args, **kwargs)
        self.mailchimp = MailChimp(mc_api=settings.MAILCHIMP_SECRET_KEY)
        self.page = 0
        self.pageSize = 100

    def init(self):
        self.totalMembers = self.mailchimp.lists.get(self.configuration['list_id'])['stats']['member_count']

    def __len__(self):
        return self.totalMembers / self.pageSize

    def options_form(self, *args, **kwargs):
        return MailchimpImporterForm(*args, **kwargs)

    def next_page(self):
        #FIXME: These field names are hardcoded
        COLUMNMAP = dict(
            email = ['email_address'],
            name = ['merge_fields.FNAME', 'merge_fields.LNAME'],
        )
        dataset = tablib.Dataset(headers=COLUMNMAP.keys())
        page = self.mailchimp.lists.members.all(self.configuration['list_id'], count=self.pageSize,
                offset=self.page*self.pageSize,
                fields=','.join(['members.email_address', 'members.merge_fields.FNAME',
                    'members.merge_fields.LNAME']))
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
    'mailchimp-people': MailchimpImporter,
    'typeform-people': TypeformImporter,
}
