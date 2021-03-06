# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2018-08-17 04:40
from __future__ import unicode_literals

import address.models
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('address', '0002_auto_20160213_1726'),
        ('crm', '0009_auto_20180807_0304'),
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('timestamp', models.DateTimeField()),
                ('uid', models.CharField(blank=True, max_length=200)),
                ('lat', models.FloatField(blank=True, null=True)),
                ('lng', models.FloatField(blank=True, null=True)),
                ('instance_id', models.CharField(blank=True, max_length=200)),
                ('attendees', models.ManyToManyField(related_name='events', to='crm.Person')),
                ('location', address.models.AddressField(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to='address.Address')),
            ],
        ),
    ]
