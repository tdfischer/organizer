# -*- coding: utf-8 -*-
# Generated by Django 1.11.16 on 2019-05-08 00:23
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0016_merge_20190508_0013'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='person',
            name='address',
        ),
    ]