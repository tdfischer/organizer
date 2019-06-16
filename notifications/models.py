# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.utils import timezone
import django_rq
from django.template import loader
from django.contrib.auth.models import User
from django.core.mail import EmailMessage
import logging
import importlib
from organizer import plugins
from django.db.models.signals import post_migrate

def migrateSources(*args, **kwargs):
    Notification.import_plugins()

    for notification in Notification.plugins:
        NotificationSource.objects.get_or_create(name=notification)
post_migrate.connect(migrateSources)

logger = logging.getLogger(__name__)

class Notification(object):
    __metaclass__ = plugins.PluginMount
    app_module_name = 'notifications'

    def send(self, noun, verb, target=None):
        channels = NotificationChannel.objects.find(sources__name=self.name)
        for channel in channels:
            channel.send(noun, verb, target)

class NotificationSource(models.Model):
    name = models.CharField(max_length=200)

    def __unicode__(self):
        return self.name

class NotificationChannel(models.Model):
    name = models.CharField(max_length=200, blank=True, null=True)
    configuration = models.TextField(blank=True, default="")
    handler = models.CharField(max_length=200, choices=[
        ('notifications.channels.Slack', 'Slack'),
    ])
    enabled = models.BooleanField()
    sources = models.ManyToManyField(NotificationSource, related_name='channels')

    def __unicode__(self):
        return self.name

    def getChannelClass(self):
        module, cls = self.handler.rsplit('.', 1)
        return getattr(importlib.import_module(module), cls)

    def send(self, noun, verb, target=None):
        Channel = self.getChannelClass()
        config = {}
        if len(self.configuration) > 0:
            config = json.loads(self.configuration)
        instance = Channel()
        try:
            log.debug("Dispatching noun=%r verb=%r target=%r to %r", noun, verb, instance)
            return instance.send(noun, verb)
        except Exception, e:
            log.error("Could not send message: %s", e)
            return e
