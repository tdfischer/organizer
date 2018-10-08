from django.core.management.base import BaseCommand
from events.models import Event
from crm.models import Person
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    def handle(*args, **kwargs):
        windowStart = timezone.now() - timedelta(days=30)
        within30Days = Q(timestamp__gte=windowStart)
        people = Person.objects.all()
        leaderboard = people.annotate(
            event_count = Count('events', filter=within30Days)
        ).order_by('-event_count')[0:15]
        print "Event leaderboard since", windowStart
        print "==========="
        for person in leaderboard:
            print "%s\t%s"%(person, person.event_count)
            friendOverlap = Person.objects.filter(events__in=person.events.all()).annotate(
                event_count = Count('events', filter=within30Days)
            ).order_by('-event_count')
            print "\tFriends with:"
            for friend in friendOverlap[0:5]:
                print "\t\t%s %s"%(friend, friend.event_count)

        events = Event.objects.filter(within30Days).annotate(
            attendee_count=Count('attendees')
        ).order_by('-attendee_count')[0:15]
        print "Most popular events"
        print "==========="
        for event in events:
            print "%s\t%s"%(event, event.attendees.count())
