# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import pytest
from datetime import timedelta

from . import models
from crm.models import Person
from events.models import Event

@pytest.mark.django_db
@pytest.mark.redis_server
@pytest.mark.mock_geocoder
def testBasicFilters():
    node = models.FilterNode.objects.create(
        prop_name = 'email',
        operator = models.FilterOperator.IS,
        value = 'test@example.com',
        content_type = ContentType.objects.get_for_model(Person)
    )
    p = Person.objects.create(email='test@example.com')
    assert(node.results.first() == p)

    notNode = models.FilterNode.objects.create(
        operator = models.FilterOperator.NOT,
        content_type = ContentType.objects.get_for_model(Person)
    )
    node.parent = notNode
    node.save()

    assert(not notNode.results.exists())

@pytest.mark.django_db
@pytest.mark.redis_server
@pytest.mark.mock_geocoder
def testDateAdjustments():
    beforeOrAfter = models.FilterNode.objects.create(
        operator = models.FilterOperator.OR,
        content_type = ContentType.objects.get_for_model(Event)
    )
    after = models.FilterNode.objects.create(
        prop_name = 'timestamp',
        operator = models.FilterOperator.GREATER_THAN,
        value = '-1d',
        content_type = ContentType.objects.get_for_model(Event),
        parent = beforeOrAfter
    )
    before = models.FilterNode.objects.create(
        prop_name = 'timestamp',
        operator = models.FilterOperator.LESS_THAN,
        value = '-1d',
        content_type = ContentType.objects.get_for_model(Event),
        parent = beforeOrAfter
    )
    yesterday = timezone.now() + timedelta(days=-1, minutes=10)
    p = Event.objects.create(timestamp=yesterday,
            end_timestamp=yesterday)
    assert(after.results.first() == p)
    assert(not before.results.exists())
    assert(beforeOrAfter.results.first() == p)
    assert(len(beforeOrAfter.as_string()) > 0)

@pytest.mark.django_db
@pytest.mark.redis_server
@pytest.mark.mock_geocoder
def testCountAnnotations():
    eventCount = models.Annotation.objects.create(
        prop_name = 'event_count',
        operator = models.AnnotationOperator.COUNT,
        field_name = 'events'
    )
    hasEvents = models.FilterNode.objects.create(
        prop_name = 'event_count',
        operator = models.FilterOperator.GREATER_THAN_EQUAL,
        value = '1',
        content_type = ContentType.objects.get_for_model(Person),
    )
    hasEvents.annotations.add(eventCount)
    hasEvents.save()
    evt = Event.objects.create(timestamp=timezone.now(),
            end_timestamp=timezone.now())
    p = Person.objects.create(email='test@example.com')
    p.events.add(evt)
    p.save()
    assert(hasEvents.results.first() == p)
    assert(hasEvents.results.first().event_count == 1)

    evt = Event.objects.create(timestamp=timezone.now(),
            end_timestamp=timezone.now())
    p.events.add(evt)
    p.save()
    assert(hasEvents.results.first().event_count == 2)

    assert(len(hasEvents.as_string()) > 0)
