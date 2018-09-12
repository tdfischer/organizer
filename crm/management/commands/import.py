from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from crm import importing
from importlib import import_module
from tqdm import tqdm
import sys
from organizer.importing import get_importer_class, collect_importers
import logging

log = logging.getLogger(__name__)

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('source', nargs='+')
        parser.add_argument('--debug', default=False, action='store_true')

    def handle(self, *args, **options):
        if options['debug']:
            logging.basicConfig(level=logging.DEBUG)

        errors = []
        totals = {}
        importers = []
        for source in options['source']:
            importerCls = get_importer_class(source)
            if importerCls is None:
                print "No such importer:", options['source']
                print "Available importers:", ', '.join(collect_importers().keys())
                return
            importers.append((source, importerCls()))
        with tqdm(importers, desc='sources', unit = ' source') as impIt:
            for (importerName, importer) in impIt:
                resource = importer.Meta.resource
                with tqdm(importer, desc=importerName, unit=' page') as it:
                    sourceTotals = {}
                    for dataPage in it:
                        log.debug('Importing %s rows...', len(dataPage))
                        result = resource.import_data(dataPage, dry_run=False,
                                raise_errors=True)
                        for (k, v) in result.totals.iteritems():
                            sourceTotals[k] = sourceTotals.get(k, 0) + v
                            totals[k] = totals.get(k, 0) + v
                        it.set_postfix(sourceTotals)
                        impIt.set_postfix(totals)
                        for err in result.row_errors():
                            errors.append(err)
        for (row, error) in errors:
            log.error("Row %s: %s", row, error[0].error)
