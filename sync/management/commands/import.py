from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from importlib import import_module
from tqdm import tqdm
import sys
from organizer.importing import get_importer_class, collect_importers
from sync import models
import logging
from django.utils import timezone

log = logging.getLogger(__name__)

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('target', nargs='*')
        parser.add_argument('--debug', default=False, action='store_true')
        parser.add_argument('--dry-run', default=False, action='store_true')

    def handle(self, *args, **options):
        if options['debug']:
            logging.basicConfig(level=logging.DEBUG)


        dryRun = options['dry_run']

        errors = []
        totals = {}
        importers = []
        if len(options['target']) == 0:
            for target in models.ImportSource.objects.filter(enabled=True):
                importers.append((target, target.make_importer()))
        else:
            for targetName in options['target']:
                target = models.ImportSource.objects.get(name=targetName)
                importers.append((target, target.make_importer()))
        with tqdm(importers, desc='sources', unit = ' source') as impIt:
            for (target, importer) in impIt:
                resource = importer.Meta.resource
                with tqdm(importer, desc=target.name, unit=' page') as it:
                    sourceTotals = {}
                    for dataPage in it:
                        log.debug('Importing %s rows...', len(dataPage))
                        result = resource.import_data(dataPage, dry_run=dryRun,
                                raise_errors=True)
                        for (k, v) in result.totals.iteritems():
                            sourceTotals[k] = sourceTotals.get(k, 0) + v
                            totals[k] = totals.get(k, 0) + v
                        it.set_postfix(sourceTotals)
                        impIt.set_postfix(totals)
                        for err in result.row_errors():
                            errors.append(err)
                    target.lastRun = timezone.now()
                    target.save()
        for (row, error) in errors:
            log.error("Row %s: %s", row, error[0].error)
