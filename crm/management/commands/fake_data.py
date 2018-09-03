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

class Command(BaseCommand):
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
        country = Country.objects.create(name=fake.country())
        state = State.objects.create(name=fake.state(), country=country)
        locality = Locality.objects.create(name=fake.city(), state=state)
        turfs = self.create_model(models.Turf, 10, {
            'name': fake.city,
            'locality': lambda: locality
        })
        people = self.create_model(models.Person, 100, {
            'name': fake.name,
            'address': fake.address,
            'email': fake.email,
            'state': lambda: random.choice(states)
        })

        for person in people:
            models.TurfMembership.objects.create(person=person,
                    turf=random.choice(turfs))

        self.create_model(Event, 20, fakeEventData)

def fakeEventData():
    start = timezone.now() + timedelta(hours=random.randint(-72, 72))
    return {
        'name': fake.catch_phrase(),
        'location': fake.address(),
        'lat': random.triangular(37, 38),
        'lng': random.triangular(-123, -122),
        'timestamp': start,
        'end_timestamp': start + timedelta(hours=1),
        'uid': fake.uuid4
    }
