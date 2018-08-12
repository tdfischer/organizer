import django_rq
from django.template import loader
from django.core.mail import EmailMessage
import logging
from django.utils import timezone
from . import models
from crm.models import Person

logger = logging.getLogger(__name__)

def processAllTargets():
    for target in models.NewNeighborNotificationTarget.objects.all():
        django_rq.enqueue(processTarget, target.pk)

def processTarget(target_id):
    target = models.NewNeighborNotificationTarget.objects.get(pk=target_id)
    email_template = loader.get_template('new-neighbors-notification.eml')
    lastSent = target.last_notified

    if lastSent is None:
        lastSent = timezone.now()

    # Grab new turf memberships created since this email was
    # last notified. > instead of >= means it excludes anything since 00:00
    # today
    logger.info('Notifying %s of newbies', target)
    newbies = Person.objects.filter(current_turf_id__in=target.turfs.values('id'), turf_memberships__joined_on__gt=lastSent,
            state__in=target.states.all().values('id'))

    if len(newbies) > 0:
        generated_email = email_template.render({
            'newbies': newbies,
        })
        email_obj = EmailMessage(
                subject="New neighbors!",
                body=generated_email,
                to=[target.email],
                reply_to=[target.email]
        )
        email_obj.encoding = 'utf-8'
        email_obj.send()
        logger.info('Queued %d newbies for %s', len(newbies),
                target.email)
    target.last_notified = timezone.now()
    target.save()
