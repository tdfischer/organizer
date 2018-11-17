from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count
from django.db.models.functions import Lower
import logging

log = logging.getLogger(__name__)

from crm.models import Person, merge_models

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('email', default=[], nargs='*')
        parser.add_argument('--debug', default=False, action='store_true')
        parser.add_argument('--dry-run', default=False, action='store_true')

    def handle(self, *args, **options):
        if options['debug']:
            logging.basicConfig(level=logging.DEBUG)

        dryRun = options['dry_run']

        allPeople = Person.objects.values(lower_email=Lower('email')) \
                .annotate(Count('id')) \
                .filter(id__count__gt=1)

        if len(options['email']) > 0:
            duplicates = allPeople.filter(lower_email__in=options['email'])
        else:
            duplicates = allPeople

        log.info("Duplicates", duplicates)
        relatedModels = []
        for dupe in duplicates.values_list('lower_email'):
            matches = Person.objects.filter(email__iexact=dupe).order_by('created')
            first = matches[0]
            duplicates = matches[1:]
            merged, relations = merge_models(first, *duplicates)
            if not dryRun:
                with transaction.atomic():
                    for d in duplicates:
                        d.delete()
                    first.save()
                    for r in relations:
                        r.save()
