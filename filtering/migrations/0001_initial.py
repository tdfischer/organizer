# -*- coding: utf-8 -*-
# Generated by Django 1.11.16 on 2018-11-07 23:52
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import enumfields.fields
import filtering.models
import mptt.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Annotation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('prop_name', models.CharField(max_length=200)),
                ('operator', enumfields.fields.EnumField(enum=filtering.models.AnnotationOperator, max_length=200)),
                ('field_name', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='FilterNode',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=200, null=True)),
                ('prop_name', models.CharField(blank=True, max_length=200, null=True)),
                ('operator', enumfields.fields.EnumField(blank=True, enum=filtering.models.FilterOperator, max_length=200, null=True)),
                ('value', models.CharField(blank=True, max_length=200, null=True)),
                ('lft', models.PositiveIntegerField(db_index=True, editable=False)),
                ('rght', models.PositiveIntegerField(db_index=True, editable=False)),
                ('tree_id', models.PositiveIntegerField(db_index=True, editable=False)),
                ('level', models.PositiveIntegerField(db_index=True, editable=False)),
                ('annotations', models.ManyToManyField(blank=True, related_name='attachment', to='filtering.Annotation')),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType')),
                ('parent', mptt.fields.TreeForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='filtering.FilterNode')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='annotation',
            name='filter',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='filtering.FilterNode'),
        ),
    ]