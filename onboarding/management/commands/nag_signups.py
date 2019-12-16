from django.core.management.base import BaseCommand
import logging
from onboarding import models, notifications

log = logging.getLogger(__name__)

class Command(BaseCommand):
    def handle(*args, **options):
        unapprovalCount = len(models.Signup.objects.filter(approved=False))
        if unapprovalCount > 0:
            notifications.UnapprovedSignupsWaiting().send('%s signups'%(unapprovalCount), 'are waiting to be approved')
