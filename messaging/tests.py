# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from hypothesis.extra.django import TestCase
from hypothesis import given, note
from hypothesis.extra.django.models import models as djangoModels
from hypothesis.strategies import text, composite
from models import Broadcast, send_queued_broadcast
from crm.models import Turf, PersonState
from crm.tests import mockRedis, mockedQueue
from django.contrib.auth.models import User
from address.models import Locality, State, Country
from rest_framework.test import APITestCase

@composite
def nonblanks(draw):
    return draw(text(alphabet='abcdefghijklmnopqrstuvwxyz', min_size=1))

class BroadcastTests(APITestCase, TestCase):
    @mockRedis
    @given(djangoModels(User), djangoModels(PersonState), djangoModels(Turf,
        locality=djangoModels(Locality, state=djangoModels(State,
            country=djangoModels(Country)))), nonblanks(), nonblanks())
    def testQueueOnSave(self, author, state, turf, subject, body):
        with mockedQueue() as queue:
            broadcast = Broadcast.objects.create(author=author, turf=turf, subject=subject,
                    body=body, target_state=state)
            queue.return_value.enqueue.assert_called_once_with(send_queued_broadcast,
                    broadcast)

    @mockRedis
    @given(djangoModels(User), djangoModels(PersonState), djangoModels(Turf,
        locality=djangoModels(Locality, state=djangoModels(State,
            country=djangoModels(Country)))), nonblanks(), nonblanks())
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
