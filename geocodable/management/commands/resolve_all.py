from django.core.management.base import BaseCommand

from geocodable import models

class Command(BaseCommand):
    def handle(self, *args, **options):
        for alias in models.LocationAlias.objects.all():
            print alias.location.fullName
            alias.location = None
            alias.save()
