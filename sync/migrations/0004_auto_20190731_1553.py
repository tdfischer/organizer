# -*- coding: utf-8 -*-
# Generated by Django 1.11.16 on 2019-07-31 15:53
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sync', '0003_synctarget_lastrun'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='SyncTarget',
            new_name='ImportSource',
        ),
    ]
