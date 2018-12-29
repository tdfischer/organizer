from django.core.management.base import BaseCommand
from filtering.models import FilterNode
from tablib import Dataset

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('query', nargs='?', default=None)
        parser.add_argument('--format', default="tsv")
        parser.add_argument('--column', action="append", default=[])

    def handle(self, *args, **options):
        if options['query']:
            if len(options['column']) == 0:
                results = FilterNode.objects.get(name=options['query']).results.values()
            else:
                results = FilterNode.objects.get(name=options['query']).results.values(*options['column'])
            dataset = Dataset(headers=results[0].keys())
            for result in results:
                dataset.append(result.values())
            print dataset.export(options['format'])
        else:
            filters = FilterNode.objects.named()
            print "Available queries:"
            for filter in filters:
                print filter.name
