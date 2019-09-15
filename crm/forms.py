from django.conf import settings
from django import forms
from mailchimp3 import MailChimp

class MailchimpListSelectionForm(forms.Form):
    list_id = forms.ChoiceField(required=True)

    def __init__(self, *args, **kwargs):
        super(MailchimpListSelectionForm, self).__init__(*args, **kwargs)
        mailchimp = MailChimp(mc_api=settings.MAILCHIMP_SECRET_KEY)
        lists = mailchimp.lists.all()
        choices = []
        for l in lists['lists']:
            choices.append((l['id'], l['name']))
        self.fields['list_id'].choices = choices

class AirtableImportExportForm(forms.Form):
    base_id = forms.CharField()
    table_name = forms.CharField()
    email_column = forms.CharField()
    name_column = forms.CharField()
    address_column = forms.CharField()
