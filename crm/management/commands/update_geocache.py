from django.core.management.base import BaseCommand, CommandError
from crm.models import Person

class Command(BaseCommand):
    def handle(self, *args, **options):
        for person in Person.objects.all():
            person.queue_geocache_update()
