# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.utils import timezone
import json
import django_rq
from django.template import loader
from django.contrib.auth.models import User
from django.core.mail import EmailMessage
import logging
import importlib
from django.db.models.signals import post_migrate
from organizer import plugins
from . import channels

class Notification(plugins.ConfigurablePlugin):
    __metaclass__ = plugins.PluginMount
    app_module_name = 'notifications'

    def __init__(self, *args, **kwargs):
        pass

    def send(self, noun, verb, target=None):
        logger.info("Sending %s notification", self.name)
        channels = NotificationChannel.objects.filter(sources__name=self.name)
        for channel in channels:
            channel.send(noun, verb, target)

def migrateSources(*args, **kwargs):
    Notification.import_plugins()

    for notification in Notification.plugins:
        NotificationSource.objects.get_or_create(name=notification)
post_migrate.connect(migrateSources)

logger = logging.getLogger(__name__)

class NotificationSource(models.Model):
    name = models.CharField(max_length=200)

    def __unicode__(self):
        return self.name

class NotificationChannel(models.Model):
    name = models.CharField(max_length=200)
    configuration = models.TextField(blank=True, default="")
    backend = models.CharField(max_length=200)
    enabled = models.BooleanField()
    sources = models.ManyToManyField(NotificationSource, related_name='channels')

    def __unicode__(self):
        return self.name

    def make_channel(self):
        importCls = channels.Channel.get_plugin(self.backend)
        return importCls(json.loads(self.configuration))

    def send(self, noun, verb, target=None):
        instance = self.make_channel()
        logger.debug("Dispatching noun=%r verb=%r target=%r to %r", noun, verb,
                target, instance)
        try:
            return instance.send(noun, verb, target)
        except Exception, e:
            logger.error("Could not send message: %s", e)
            return e
