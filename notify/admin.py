# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from . import models, channels
from django.utils.html import format_html, format_html_join

class SourceAdmin(admin.ModelAdmin):
    fields = [
        'name', 'channel_list'
    ]

    list_display = [
        'name', 'channel_list'
    ]

    readonly_fields = ['channel_list']

    def channel_list(self, obj):
        return format_html(
            "<ul>{}</ul>",
            format_html_join(
                '\n',
                "<li>{}</li>",
                map(lambda x: (x.name, ), obj.channels.all())
            )
        )

from sync.admin import PluginModelAdmin

from django import forms
class ChannelForm(forms.ModelForm):
    backend = forms.CharField(disabled=True)
    class Meta:
        model = models.NotificationChannel
        fields = ['name', 'enabled', 'backend', 'sources']

def send_test(modeladmin, request, queryset):
    for channel in queryset:
        channel.send(request.user, 'tested', channel)
send_test.short_description = 'Send test notification'

class ChannelAdmin(PluginModelAdmin):
    plugin_class = channels.Channel
    plugin_name_field = 'backend'
    plugin_config_field = 'configuration'
    base_form = ChannelForm
    default_config_form = forms.Form
    add_form_template = 'admin/notify/add.html'

    actions = (
        send_test,
    )

    list_display = [
        'name', 'backend', 'enabled'
    ]

admin.site.register(models.NotificationChannel, ChannelAdmin)
admin.site.register(models.NotificationSource, SourceAdmin)
