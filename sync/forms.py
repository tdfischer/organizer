from django import forms
from . import models

class ImportSourceForm(forms.ModelForm):
    backend = forms.CharField(disabled=True)
    class Meta:
        model = models.ImportSource
        fields = ['name', 'enabled', 'backend']

class ExportSinkForm(forms.ModelForm):
    backend = forms.CharField(disabled=True)
    class Meta:
        model = models.ExportSink
        fields = ['name', 'enabled', 'backend']

class DefaultImportSourceConfigForm(forms.Form):
    pass

class DefaultExportSinkConfigForm(forms.Form):
    pass
