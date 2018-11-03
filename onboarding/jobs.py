import django_rq
from django.template import loader
from django.core.mail import EmailMessage
from django.conf import settings
import logging
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
import django_rq

from . import models
from crm.models import Person

logger = logging.getLogger(__name__)

def processAllTargets():
    for target in models.NewNeighborNotificationTarget.objects.all():
        processTarget.delay(target.pk)

@django_rq.job
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

@receiver(post_save, sender=Person)
def queuePersonChange(sender, instance, **kwargs):
    if settings.AUTOMATIC_ONBOARDING:
        runOnboarding.delay(instance)

@django_rq.job
def runOnboarding(person):
    logger.info("Executing onboarding for %s", person)
    components = models.OnboardingComponent.objects.filter(enabled=True)

    for component in components:
        if not component.personHasBeenOnboarded(person):
            if component.filter.results.filter(pk=person.pk).exists():
                logger.info("Onboarding %s to %s", person, component)
                result = None
                try:
                    result = component.onboardPerson(person)
                except Exception, e:
                    logger.error("Caught error while onboarding %s: %s",
                            person, e)
                    result = (False, str(e))
                models.OnboardingStatus.objects.create(
                    person = person,
                    component = component,
                    success = result[0],
                    message = result[1]
                )
                logger.info("Onboarded %s to %s: %r", person, component,
                        result)
