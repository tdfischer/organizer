# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from . import models, forms
from django.conf.urls import url
from django.contrib import admin
from organizer import importing 
from django.template.response import TemplateResponse
from django.urls import reverse
from django.http.response import HttpResponseRedirect
from django.http import Http404
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

class SyncAdmin(admin.ModelAdmin):
    list_filter = ['enabled', 'backend']
    list_display = [
        'name', 'backend', 'enabled', 'lastRun'
    ]

    actions = (
        enable_target,
        disable_target,
    )

    def get_urls(self):
        urls = super(SyncAdmin, self).get_urls()
        return [
            #url('^add', self.select_backend_view, name='sync_synctarget_add'),
            url('^add/(?P<backend_name>.+)', self.configure_and_add_view, name='sync_configure_and_add'),
            #url('^(?P<pk>\d+)/change', self.configure_backend_view)
        ] + urls

    def configure_and_add_view(self, request, backend_name):
        return self.change_view(request, None, backend_name=backend_name)

    def change_view(self, request, object_id, form_url='', extra_context=None, backend_name=None):
        source = None
        form = None
        initial_config = {}
        extra_context = extra_context or {}
        formConstructor = forms.DefaultImportSourceConfigForm

        if object_id is not None:
            source = models.ImportSource.objects.get(pk=object_id)
            initial_config = json.loads(source.configuration)
            backend_name = source.backend

        if backend_name is None and source is None:
            raise Http404()

        importerCls = importing.get_importer_class(backend_name)
        importerInstance = None
        if importerCls is not None:
            importerInstance = importerCls(initial_config)
            formConstructor = importerInstance.options_form

        if request.method == 'POST':
            base_form = forms.ImportSourceForm(request.POST, prefix='base',
                    instance=source, initial={'backend': backend_name})
            form = formConstructor(request.POST,
                    initial=initial_config, prefix='options')
        else:
            base_form = forms.ImportSourceForm(prefix='base', instance=source,
                    initial={'backend': backend_name})
            form = formConstructor(prefix='options', initial=initial_config)
        
        if form.is_valid() and base_form.is_valid():
            isNew = False
            if source is None:
                isNew = True
            change_message = self.construct_change_message(request, form, [],
                    isNew)
            source = base_form.save(commit=False)
            source.backend = backend_name
            source.configuration = json.dumps(form.cleaned_data)
            source.save()
            if isNew:
                self.log_addition(request, source, change_message)
            else:
                self.log_change(request, source, change_message)
            return HttpResponseRedirect(reverse('admin:sync_importsource_changelist'))

        extra_context['options_form'] = form
        extra_context['backend_name'] = backend_name
        extra_context['base_form'] = base_form
        extra_context['has_backend'] = True
        return super(SyncAdmin, self).change_view(request, object_id, form_url,
                extra_context)

        context = dict(
            self.admin_site.each_context(request),
            options_form=form,
            base_form=base_form
        )
        return TemplateResponse(request, "configure.html", context)

    def render_change_form(self, request, context, add=False, change=False,
            form_url='', obj=None):
        if 'has_backend' in context:
            add = False
        return super(SyncAdmin, self).render_change_form(request, context,
                add, change, form_url, obj)


    add_form_template = 'admin/sync/add.html'
    def add_view(self, request, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['backends'] = importing.get_importer_classes()
        return super(SyncAdmin, self).add_view(request, form_url, extra_context)

admin.site.register(models.ImportSource, SyncAdmin)
