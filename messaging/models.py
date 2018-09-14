# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.utils import timezone
import django_rq
from django.template import loader
from django.contrib.auth.models import User
from django.core.mail import EmailMessage
from crm.models import Turf, PersonState
import logging

logger = logging.getLogger(__name__)

def send_queued_email(email_obj):
    logger.debug("Sending mail %r", email_obj)
    email_obj.send()

def send_queued_broadcast(broadcast):
    logger.debug("Sending broadcast %r", broadcast)
    email_template = loader.get_template('turf-broadcast.eml')

    targets = map(lambda x: x.person.email,
            broadcast.turf.members.filter(person__state=broadcast.target_state))
    generated_email = email_template.render({
        'broadcast': broadcast,
    })
    logging.info('Broadcasting to %s %s emails in %s', len(targets),
            broadcast.target_state, broadcast.turf)
    for t in targets:
        email_obj = EmailMessage(
                subject=broadcast.subject,
                body=generated_email,
                to=[t],
                reply_to=[broadcast.author.email]
        )
        email_obj.encoding = 'utf-8'
        django_rq.enqueue(send_queued_email, email_obj)

class Broadcast(models.Model):
    subject = models.CharField(max_length=200)
    body = models.TextField()
    turf = models.ForeignKey(Turf)
    sent_on = models.DateTimeField()
    author = models.ForeignKey(User)
    target_state = models.ForeignKey(PersonState)

    def save(self, *args, **kwargs):
        if not self.sent_on:
            self.sent_on = timezone.now()
        ret = super(Broadcast, self).save(*args, **kwargs)
        logging.info("Queued up broadcast %s", self)
        django_rq.enqueue(send_queued_broadcast, self)
        return ret

    def __unicode__(self):
        return "%s: %s to %s: %s"%(self.sent_on, self.author, self.turf,
                self.subject)
