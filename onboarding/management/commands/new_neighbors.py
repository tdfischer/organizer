from django.utils import timezone
from django.core.management.base import BaseCommand
from django.db.models import Count
from crm.models import Turf
from django.core.mail import EmailMessage
from django.template import loader
import django_rq
import logging

logger = logging.getLogger(__name__)

def send_queued_email(email_obj):
    email_obj.send()

class Command(BaseCommand):

    def handle(self, *args, **options):
        email_template = loader.get_template('new-neighbors-notification.eml')

        for turf in Turf.objects.all():
            notifications = turf.notification_targets.all()

            if len(notifications) == 0:
                logging.debug('No notifications configured for %s', turf)
                continue

            for target in notifications:
                self.processTarget(target, email_template)

    def processTarget(self, target, email_template):
        lastSent = target.last_notified

        if lastSent is None:
            lastSent = timezone.now()

        # Grab new turf memberships created since this email was
        # last notified. > instead of >= means it excludes anything since 00:00
        # today
        newbies = target.turf.members.filter(joined_on__gt=lastSent)

        if len(newbies) > 0:
            generated_email = email_template.render({
                'newbies': newbies,
                'turf': target.turf
            })
            email_obj = EmailMessage(
                    subject="New neighbors in %s"%(target.turf.name),
                    body=generated_email,
                    to=[target.email],
                    reply_to=[target.email]
            )
            email_obj.encoding = 'utf-8'
            django_rq.enqueue(send_queued_email, email_obj)
            logger.info('Queued %d newbies for %s', len(newbies),
                    target.email)
            target.last_notified = timezone.now()
            target.save()
