# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from hypothesis.extra.django import TestCase
from hypothesis import given, note
from hypothesis.extra.django.models import models as djangoModels
from hypothesis.strategies import text, composite, lists, just, tuples
from models import Broadcast, send_queued_broadcast
from crm.models import Turf, PersonState, TurfMembership
from crm.tests import mockRedis, mockedQueue, people, defaultStates, nonblanks
from django.contrib.auth.models import User
from address.models import Locality, State, Country
from rest_framework.test import APITestCase
from mock import MagicMock

locality = djangoModels(Locality, state=djangoModels(State,
    country=djangoModels(Country)))

broadcasts = djangoModels(PersonState).flatmap(
    lambda state: locality.flatmap(
        lambda locality: tuples(
            djangoModels(Broadcast,
                turf=djangoModels(Turf, locality=just(locality)),
                author=djangoModels(User),
                target_state=defaultStates(),
            ),
            lists(people(), min_size=1, max_size=1)
        )
    )
)

class BroadcastTests(APITestCase, TestCase):
    @mockRedis
    @given(djangoModels(User), djangoModels(PersonState), djangoModels(Turf,
        locality=locality), nonblanks(), nonblanks())
    def testQueueOnSave(self, author, state, turf, subject, body):
        with mockedQueue() as queue:
            broadcast = Broadcast.objects.create(author=author, turf=turf, subject=subject,
                    body=body, target_state=state)
            queue.return_value.enqueue.assert_called_once_with(send_queued_broadcast,
                    broadcast)

    @mockRedis
    @given(djangoModels(User), djangoModels(PersonState), djangoModels(Turf,
        locality=locality), nonblanks(), nonblanks())
    def testAPI(self, author, state, turf, subject, body):
        with mockedQueue() as queue:
            data = {
                'subject': subject,
                'body': body,
                'turf': turf.id,
                'target_state': state.name
            }
            self.client.force_authenticate(user=author)
            resp = self.client.post('/api/broadcasts/', data)
            note("Response %r"%(resp.data))
            self.assertEqual(resp.status_code, 201)

            broadcast = Broadcast.objects.get(pk=resp.data['id'])
            queue.return_value.enqueue.assert_called_once_with(send_queued_broadcast,
                    broadcast)
            self.assertEqual(broadcast.author, author)

    @mockRedis
    @given(broadcasts)
    def testSendBroadcast(self, broadcastsAndPeople):
        broadcast, people = broadcastsAndPeople
        for person in people:
            TurfMembership.objects.create(turf=broadcast.turf, person=person)
        with mockedQueue() as queue:
            send_queued_broadcast(broadcast)
            queue.return_value.enqueue.assert_called_once()
            note(queue.return_value.enqueue.call_args)
            args, _ = queue.return_value.enqueue.call_args
            queuedFunc, args = (args[0], args[1:])
            messageMock = MagicMock()
            queuedFunc(messageMock)
            messageMock.send.assert_called_once()
