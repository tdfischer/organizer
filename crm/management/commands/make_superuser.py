from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('email')

    def handle(self, *args, **options):
        user = User.objects.get(email=options['email'])
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print "Updated %s to superuser"%(user)
