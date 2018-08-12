from django.core.management.base import BaseCommand
from onboarding import jobs

class Command(BaseCommand):

    def handle(self, *args, **options):
        jobs.processAllTargets()
