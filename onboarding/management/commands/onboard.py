from django.core.management.base import BaseCommand
from onboarding.models import runOnboarding
from crm.models import Person
import logging

log = logging.getLogger(__name__)

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('email', nargs='*', default=[])
        parser.add_argument('--dry-run', default=False, action='store_true')

    def handle(*args, **options):
        if len(options['email']) == 0:
            people = Person.objects.all()
        else:
            people = Person.objects.filter(email__in=options['email'])

        for person in people:
            if not options['dry_run']:
                runOnboarding.delay(person)
            log.info("Queued onboarding check for %s", person)
