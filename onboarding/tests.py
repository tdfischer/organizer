# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
import pytest

from . import jobs, models, components
from crm.models import Person
from filtering.models import FilterNode

@pytest.fixture
def person(redis_server):
    return Person.objects.get_or_create(name='',
            email='test@example.com')[0]

@pytest.fixture
def person_filter(db):
    return FilterNode.objects.create(
        content_type=ContentType.objects.get_for_model(Person),
        prop_name='id',
        operator='gte',
        value='0'
    )

@pytest.fixture
def onboarding_component(db, person_filter):
    return models.OnboardingComponent.objects.create(
        name='Test Component',
        enabled=True,
        handler='onboarding.tests.TestComponent',
        filter=person_filter
    )

class TestComponent(components.Component):
    def handle(self, configuration, person):
        return (configuration.get('result', True), configuration.get('message', 'Success!'))

@pytest.mark.django_db
def testOnboarding(onboarding_component, person_filter, person):
    assert models.OnboardingStatus.objects.all().count() == 0

    # Start with a filter that never matches (id < 0)
    person_filter.operator = 'lt'
    person_filter.save()

    onboarding_component.configuration = '{"result": false}'
    onboarding_component.save()

    # Onboarding when no filters match should have no effect.
    jobs.runOnboarding(person)
    assert models.OnboardingStatus.objects.all().count() == 0

    # Onboarding when a fitler matches should create a status
    person_filter.operator = 'gte'
    person_filter.save()
    jobs.runOnboarding(person)
    assert models.OnboardingStatus.objects.all().count() == 1
    assert models.OnboardingStatus.objects.last().success == False

    # Onboarding someone unsuccessfully should create a new result
    jobs.runOnboarding(person)
    assert models.OnboardingStatus.objects.all().count() == 2
    assert models.OnboardingStatus.objects.last().success == False

    onboarding_component.configuration = '{"result": true}'
    onboarding_component.save()

    # Onboarding someone successfully should keep older logs around
    jobs.runOnboarding(person)
    assert models.OnboardingStatus.objects.all().count() == 3
    assert models.OnboardingStatus.objects.last().success == True

    # Onboarding someone after they've been onboarded should have no effect.
    jobs.runOnboarding(person)
    assert models.OnboardingStatus.objects.all().count() == 3
    assert models.OnboardingStatus.objects.last().success == True
