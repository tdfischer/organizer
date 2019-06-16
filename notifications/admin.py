# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from . import models
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

admin.site.register(models.NotificationChannel)
admin.site.register(models.NotificationSource, SourceAdmin)
