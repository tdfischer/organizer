from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from address.models import Locality, State, Country
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
        states = self.create_model(models.PersonState, 4, {
            'name': fake.word
        })
        country = Country.objects.get_or_create(name=fake.country())[0]
        state = State.objects.get_or_create(name=fake.state(),
                country=country)[0]
        locality = Locality.objects.get_or_create(name=fake.city(),
                state=state)[0]
        turfs = self.create_model(models.Turf, 10, {
            'name': fake.city,
            'locality': lambda: locality
        })
        localFakeAddress = lambda: fakeAddress(dict(
            locality = locality.name,
            country = country.name,
            state = state.name
        ))

        print "Populating %s, %s, %s with 100 people..."%(locality.name, state.name,
                country.name)
        people = self.create_model(models.Person, 100, {
            'name': fakeName,
            'address': localFakeAddress,
            'email': fake.email,
            'state': lambda: random.choice(states),
            'lat': fakeLatitude,
            'lng': fakeLongitude
        })

        events = self.create_model(Event, 20, lambda: fakeEventData(localFakeAddress))

        for person in people:
            models.TurfMembership.objects.create(person=person,
                    turf=random.choice(turfs))
            print person, "moved in to", person.current_turf

        for person in people:
            for idx in range(0, 10):
                evt = random.choice(events)
                evt.attendees.add(person)
                evt.save()

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
        'lat': fakeLatitude(),
        'lng': fakeLongitude(),
        'timestamp': start,
        'end_timestamp': start + timedelta(hours=1),
        'uid': fake.uuid4
    }

def fakeName():
    if random.gauss(50, 25) >= 50:
        return fake.name()
    return None
