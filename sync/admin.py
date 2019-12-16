# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from . import models, forms
from django.conf.urls import url
from django.contrib import admin
from organizer import importing, exporting
from django.utils import timezone
from django.template.response import TemplateResponse
from django.core.urlresolvers import reverse
from django.http.response import HttpResponseRedirect
from django.http import Http404
import django_rq
import json

def enable_target(modeladmin, request, queryset):
    for target in queryset:
        target.enabled = True
        target.save()
enable_target.short_description = "Enable selected targets"

def disable_target(modeladmin, request, queryset):
    for target in queryset:
        target.enabled = True
        target.save()
disable_target.short_description = "Disable selected targets"

def run_target(modeladmin, request, queryset):
    for target in queryset:
        django_rq.enqueue(target.run)
run_target.short_description = "Run selected targets"

class PluginModelAdmin(admin.ModelAdmin):
    list_filter = ['enabled', 'backend']
    list_display = [
        'name', 'backend', 'enabled', 'lastRun'
    ]

    actions = (
        enable_target,
        disable_target,
        run_target,
    )

    def get_form(self, request, obj=None, **kwargs):
        kwargs['form'] = self.base_form
        return super(PluginModelAdmin, self).get_form(request, obj, **kwargs)

    def get_options_form(self, backend_name):
        pluginCls = self.plugin_class.get_plugin(backend_name)
        if pluginCls is None:
            return self.default_config_form
        return pluginCls({}).options_form

    def get_urls(self):
        urls = super(PluginModelAdmin, self).get_urls()
        info = self.model._meta.app_label, self.model._meta.model_name
        return [
            url('^add/(?P<backend_name>.+)', self.configure_and_add_view,
                name='%s_%s_add'%(info))
        ] + urls

    def configure_and_add_view(self, request, backend_name):
        return self.change_view(request, None, backend_name=backend_name)

    def change_view(self, request, object_id, form_url='', extra_context=None, backend_name=None):
        source = None
        form = None
        initial_config = {}
        extra_context = extra_context or {}

        if object_id is not None:
            source = self.model.objects.get(pk=object_id)
            initial_config = json.loads(getattr(source, self.plugin_config_field))
            backend_name = getattr(source, self.plugin_name_field)

        # If we have no backend, and we have no source id, 404
        if backend_name is None and source is None:
            raise Http404()

        formConstructor = self.get_form(request, source)
        configFormConstructor = self.get_options_form(backend_name)

        if request.method == 'POST':
            base_form = formConstructor(request.POST, prefix='base',
                    instance=source, initial={'backend': backend_name})
            form = configFormConstructor(request.POST,
                    initial=initial_config, prefix='options')
        else:
            base_form = formConstructor(prefix='base', instance=source,
                    initial={'backend': backend_name})
            form = configFormConstructor(prefix='options', initial=initial_config)
        
        if form.is_valid() and base_form.is_valid():
            isNew = False
            if source is None:
                isNew = True
            change_message = self.construct_change_message(request, form, [],
                    isNew)
            source = base_form.save(commit=False)
            for k,v in base_form.cleaned_data.iteritems():
                setattr(source, k, v)
            setattr(source, self.plugin_name_field, backend_name)
            setattr(source, self.plugin_config_field, json.dumps(form.cleaned_data))
            source.save()
            if isNew:
                self.log_addition(request, source, change_message)
            else:
                self.log_change(request, source, change_message)
            info = self.model._meta.app_label, self.model._meta.model_name
            change_url = 'admin:%s_%s_changelist'%(info)
            return HttpResponseRedirect(reverse(change_url))

        extra_context['options_form'] = form
        extra_context['backend_name'] = backend_name
        extra_context['base_form'] = base_form
        extra_context['has_backend'] = True
        return super(PluginModelAdmin, self).change_view(request, object_id, form_url,
                extra_context)

    def render_change_form(self, request, context, add=False, change=False,
            form_url='', obj=None):
        if 'has_backend' in context:
            add = False
        return super(PluginModelAdmin, self).render_change_form(request, context,
                add, change, form_url, obj)


    add_form_template = 'admin/sync/add.html'
    def add_view(self, request, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['backends'] = self.plugin_class.plugins
        info = self.model._meta.app_label, self.model._meta.model_name
        extra_context['add_url'] = 'admin:%s_%s_add'%(info)
        return super(PluginModelAdmin, self).add_view(request, form_url, extra_context)

class ImportAdmin(PluginModelAdmin):
    plugin_class = importing.DatasetImporter
    plugin_name_field = 'backend'
    plugin_config_field = 'configuration'
    base_form = forms.ImportSourceForm
    default_config_form = forms.DefaultImportSourceConfigForm

class ExportAdmin(PluginModelAdmin):
    plugin_class = exporting.DatasetExporter
    plugin_name_field = 'backend'
    plugin_config_field = 'configuration'
    base_form = forms.ExportSinkForm
    default_config_form = forms.DefaultExportSinkConfigForm

admin.site.register(models.ImportSource, ImportAdmin)
admin.site.register(models.ExportSink, ExportAdmin)
