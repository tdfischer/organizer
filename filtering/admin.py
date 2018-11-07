# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from django.utils.html import format_html, format_html_join
from . import models

class FilterNodeAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'query', 'kind', 'annotations_used'
    )

    list_filter = (
        ('content_type', admin.RelatedOnlyFieldListFilter),
    )

    def kind(self, obj):
        return str(obj.content_type)

    def annotations_used(self, obj):
        if not obj.children.all().exists():
            return "None"
        return ', '.join((str(a) for a in obj.get_family()))

    def query(self, obj):
        return obj.as_string()

    readonly_fields = ['results']

    def results(self, obj):
        res = None
        try:
            res = obj.results.values()
        except Exception, e:
            return format_html('<em>{}</em>', e)

        if not res.exists():
            return format_html('<em>No results</em>')

        headers = ((header,) for header in res[0].keys())
        rows = (
            (format_html_join('\n\t\t', '<td>{}</td>',
                ((v,) for v in r.values()),
            ),) for r in res
        )
        return format_html(
            '<table><tr>{}</tr>{}</table>',
            format_html_join('\n', '<th>{}</th>', headers),
            format_html_join('\n\t', '<tr>{}</tr>', rows)
        )

admin.site.register(models.FilterNode, FilterNodeAdmin)
admin.site.register(models.Annotation)
