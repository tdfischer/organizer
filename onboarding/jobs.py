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
