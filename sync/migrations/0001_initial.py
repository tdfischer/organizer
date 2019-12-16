# -*- coding: utf-8 -*-
# Generated by Django 1.11.16 on 2019-07-30 17:37
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SyncTarget',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('backend', models.CharField(max_length=255)),
                ('configuration', models.TextField()),
            ],
        ),
    ]