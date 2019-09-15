from django.core.management.base import BaseCommand, CommandError
from crm import models
from organizer.exporting import DatasetExporter
from tqdm import tqdm
import logging

log = logging.getLogger(__name__)

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('destination', nargs='+')
        parser.add_argument('--debug', default=False, action='store_true')
        parser.add_argument('--dry-run', default=False, action='store_true')

    def handle(self, *args, **options):
        if options['debug']:
            logging.basicConfig(level=logging.DEBUG)

        dryRun = options['dry_run']

        exporters = []
        if len(options['target']) == 0:
            for target in models.ExportSink.objects.filter(enabled=True):
                exporters.append((target, target.make_exporter()))
        else:
            for targetName in options['target']:
                target = models.ExportSink.objects.get(name=targetName)
                exporters.append((target, target.make_exporter))

        with tqdm(exporters, desc='destinations', unit=' destination') as expIt:
            for (target, exporter) in expIt:
                exportedResource = exporter.Meta.resource()
                with tqdm(exporter, desc=target.name, unit=' page') as it:
                    log.debug('Exporting %s items', len(exporter))
                    for page in it:
                        exporter.export_page(page, dry_run=dryRun)
                    target.lastRun = timezone.now()
                    target.save()
