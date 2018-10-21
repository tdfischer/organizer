from django.core.management.base import BaseCommand
from events.models import Event
from django.utils import timezone
from crm.models import Person
from datetime import timedelta
from django.db.models import Sum

class Command(BaseCommand):
    def handle(*args, **kwargs):
        oneYearAgo = timezone.now() + timedelta(days=-365)
        for person in Person.objects.all():
            isVotingMember = person.events.filter(end_timestamp__gte=oneYearAgo).count() >= 3
            isPatron = person.donations.filter(timestamp__gte=oneYearAgo).count() >= 1
            isVolunteer = person.events.filter(end_timestamp__gte=oneYearAgo).count() >= 1
            personTag = None
            if isVotingMember:
                personTag = "Voting"
            elif isVolunteer:
                personTag = "Volunteer"
            elif isPatron:
                personTag = "Patron"

            if personTag is not None:
                print "[%s] %s <%s> - %s events, $%s"%(personTag, person.name, person.email,
                        person.events.count(),
                        person.donations.aggregate(total=Sum('value') / 100)['total'])
