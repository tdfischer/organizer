from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from geocodable.models import Location, LocationType, LocationAlias
from faker import Faker
import random
from datetime import timedelta
from django.utils import timezone
import uuid

from crm import models
from events.models import Event
fake = Faker()

class Command(BaseCommand): # pragma: no cover
    def create_model(self, Model, count, fakers):
        ret = []
        for i in range(0, count):
            args = {}
            fakedItemsIter = iter([])
            if callable(fakers):
                fakedItemsIter = fakers().iteritems()
            else:
                fakedItemsIter = fakers.iteritems()
            for argName,genFunc in fakedItemsIter:
                if callable(genFunc):
                    args[argName] = genFunc()
                else:
                    args[argName] = genFunc
            ret.append(Model.objects.create(**args))
        return ret

    def handle(self, *args, **options):
        if not settings.DEBUG:
                raise EnvironmentError("I won't allow you to run fake_data without setting the DEBUG environment variable.")
        country = Location.objects.get_or_create(name=fake.country(),
                type=LocationType.COUNTRY)[0]
        state = Location.objects.get_or_create(name=fake.state(),
                parent=country, type=LocationType.STATE)[0]
        locality = Location.objects.get_or_create(name=fake.city(),
                parent=state, type=LocationType.LOCALITY)[0]

        print "Populating %s with 100 people..."%(locality.fullName)
        people = self.create_model(models.Person, 100, {
            'name': fakeName,
            'location': lambda: fakeLocationAlias(locality),
            'email': fake.email,
        })

        events = self.create_model(Event, 20, lambda: fakeEventData(lambda:
            fakeLocationAlias(locality)))

        for person in people:
            for idx in range(0, 10):
                evt = random.choice(events)
                evt.attendees.add(person)
                evt.save()

def fakeLocation(parent):
    return Location.objects.create(parent=parent, lat=fakeLatitude(),
            lng=fakeLongitude(), type=LocationType.ROUTE, name=fake.name() + ' Street')

def fakeLocationAlias(parent):
    return LocationAlias.objects.create(location=fakeLocation(parent),
            raw=parent.fullName, nonce=parent.fullName)

def fakeLatitude():
    return random.triangular(settings.DUMMY_GEOCODE_CENTER[0]-0.01,
            settings.DUMMY_GEOCODE_CENTER[0]+0.01)

def fakeLongitude():
    return random.triangular(settings.DUMMY_GEOCODE_CENTER[1]-0.01,
            settings.DUMMY_GEOCODE_CENTER[1]+0.01)

def fakeAddress(template={}):
    street = getattr(template, 'street', fake.name() + ' Street')
    city = getattr(template, 'locality', fake.city())
    state = getattr(template, 'state', fake.state())
    country = getattr(template, 'country', fake.country())
    if random.gauss(50, 25) >= 50:
        return {
            'raw': street + ", " + city + ", " + state + ", " + country,
            'route': street,
            'locality': city,
            'state': state,
            'country': country,
        }
    else:
        return None

def fakeEventData(locationFaker):
    start = timezone.now() + timedelta(hours=random.randint(-72, 72))
    return {
        'name': fake.catch_phrase(),
        'location': locationFaker(),
        'timestamp': start,
        'end_timestamp': start + timedelta(hours=1),
        'uid': fake.uuid4
    }

def fakeName():
    if random.gauss(50, 25) >= 50:
        return fake.name()
    return None
