# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from models import Broadcast, send_queued_broadcast
from crm.models import Person, Turf, PersonState, TurfMembership
from django.contrib.auth.models import User
from address.models import Locality, State, Country
from mock import MagicMock
import pytest

@pytest.fixture
def locality():
    return Locality.objects.create(
        name='Locality',
        state=State.objects.create(name='State',
            country=Country.objects.create(name='Country'))
    )

@pytest.fixture
def turf(locality):
    return Turf.objects.create(name='Turf', locality=locality)

@pytest.fixture
def people(redis_queue, default_personstate):
    return list([Person.objects.create(email="%s@example.com"%(i),
        state=default_personstate) for i in range(0, 10)])

@pytest.mark.django_db
def testAPI(redis_queue, api_client, test_user, default_personstate, turf):
    """Test that submitting a broadcast via the API queues it for processing"""
    data = {
        'subject': 'Subject',
        'body': 'Body',
        'turf': turf.id,
        'target_state': default_personstate.name
    }
    api_client.force_authenticate(user=test_user)
    resp = api_client.post('/api/broadcasts/', data)
    print "Response %r"%(resp.data)
    assert resp.status_code == 201

    broadcast = Broadcast.objects.get(pk=resp.data['id'])
    redis_queue.enqueue.assert_called_once_with(send_queued_broadcast,
            broadcast)
    assert broadcast.author == test_user

@pytest.mark.django_db
def testSendBroadcast(redis_queue, test_user, turf, default_personstate, people):
    """Test that sending a queued broadcast queues up and later sends emails to each person"""
    redis_queue.reset_mock()
    broadcast = Broadcast.objects.create(author=test_user, turf=turf,
            subject='Subject',
            body='Body', target_state=default_personstate)
    redis_queue.enqueue.assert_called_once_with(send_queued_broadcast,
            broadcast)
    for person in people:
        TurfMembership.objects.create(turf=broadcast.turf, person=person)
    redis_queue.reset_mock()
    send_queued_broadcast(broadcast)
    assert len(redis_queue.enqueue.mock_calls) == len(people)
    for (person, (args, kwargs)) in zip(people,
            redis_queue.enqueue.call_args_list):
        queuedFunc, message = (args[0], args[1])
        assert message.to[0] == person.email
        messageMock = MagicMock()
        queuedFunc(messageMock)
        messageMock.send.assert_called_once()
