from django.core.management.base import BaseCommand
from events.models import Event
from crm.models import Person

class Command(BaseCommand):
    def handle(*args, **kwargs):
        for person in Person.objects.all():
            if person.events.count() >= 3 or person.state.name == "Organizer":
                print "[Voting] %s: %s <%s> - %s"%(person.state, person.name, person.email,
                        person.events.count())
            elif person.events.count() >= 1 or person.donations.count() >= 1:
                print "%s: %s <%s> - %s"%(person.state, person.name, person.email,
                        person.events.count())
