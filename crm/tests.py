# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from mock import create_autospec, MagicMock, patch
from hypothesis.extra.django import TestCase
from hypothesis.extra.django.models import models as djangoModels
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from urllib import quote_plus
from hypothesis import given, assume, note, settings as hypothesisSettings
import math
from hypothesis.strategies import characters, just, sampled_from, emails, floats, composite, lists, dictionaries, one_of, text, none, fixed_dictionaries
import string
from geopy.location import Location
from geopy.point import Point
from . import geocache, models, exporting
from rest_framework.test import APITestCase
import pytest
from address.models import Address
import functools
from django.urls.base import reverse

geocodeDict = {
    'raw': text(),
    'street_number': text(),
    'route': text(),
    'locality': text(),
    'postal_code': text(alphabet=('-',) + tuple(string.digits)),
    'state': text(),
    'country': text(),
    'neighborhood': text(),
    'lat': floats(),
    'lng': floats()
}

geocodeTest = \
    one_of(
        dictionaries(text(), one_of(text(), none())),
        fixed_dictionaries(geocodeDict)
    )

@pytest.fixture
def person(redis_server):
    return models.Person.objects.get_or_create(name='',
            email='test@example.com')[0]

@composite
def peopleArgs(draw):
    return draw(one_of(
        fixed_dictionaries(dict(
            name=one_of(just(None), text()),
            email=emails().filter(lambda x: len(x) < 100 and '/' not in x),
            address=one_of(just(None), text()),
        )),
        fixed_dictionaries(dict(
            name=one_of(just(None), text()),
            email=emails().filter(lambda x: len(x) < 100 and '/' not in x),
        )),
        fixed_dictionaries(dict(
            name=one_of(just(None), text()),
            email=emails().filter(lambda x: len(x) < 100 and '/' not in x),
        )),
        fixed_dictionaries(dict(
            email=emails().filter(lambda x: len(x) < 100 and '/' not in x),
        ))))

@composite
def people(draw):
    return models.Person.objects.create(
        name=draw(nonblanks()),
        email=draw(emails().filter(lambda x: len(x) < 100 and '/' not in x)),
        address=None,
    )

@composite
def nonblanks(draw):
    return draw(text(min_size=1, alphabet=characters(whitelist_categories=('Lu', 'Ll'))))

@composite
def latlngs(draw):
    return {
        'lat': draw(floats(min_value=-90, max_value=90)),
        'lng': draw(floats(min_value=-180, max_value=180))
    }

@composite
def googleAddressTypes(draw):
    return draw(lists(sampled_from((
        'locality', 'street_number', 'route', 'postal_code', 'state',
        'administrative_area_level_1',
        'administrative_area_level_2',
        'administrative_area_level_3',
        'administrative_area_level_4',
        'administrative_area_level_5',
        'neighborhood', 'country', 'intersection', 'political',
        'colloquial_area', 'ward', 'sublocality', 'premise', 'subpremise',
        'natural_feature', 'airport', 'park', 'point_of_interest', 'floor',
        'establishment', 'parking', 'post_box', 'postal_town', 'room',
        'bus_station', 'train_station', 'transit_station'
    )), min_size=1, unique=True))

@composite
def googleAddressComponents(draw):
    return {
        'types': draw(googleAddressTypes()),
        'long_name': draw(text()),
        'short_name': draw(text())
    }

@composite
def googleResponses(draw):
    return {
        'formatted_address': draw(text()),
        'place_id': draw(text()),
        'geometry': {
            'location': draw(latlngs()),
            'viewport': {
                'northeast': draw(latlngs()),
                'southwest': draw(latlngs())
            },
            'bounds': {
                'northeast': draw(latlngs()),
                'southwest': draw(latlngs())
            }
        },
        'types': draw(googleAddressTypes()),
        'address_components': draw(lists(googleAddressComponents(), min_size=1))
    }

@composite
def locations(draw):
    resp = draw(googleResponses())
    asPoint = Point(resp['geometry']['location']['lat'], resp['geometry']['location']['lng'])
    return Location(resp['formatted_address'], asPoint, resp)

@pytest.mark.skip(reason="Porting to geocodable API")
@pytest.mark.django_db
@given(locations())
def testDecoder(response):
    decoded = geocache.decode_response(response)
    assert response.latitude == decoded['lat']
    assert response.longitude == decoded['lng']

@pytest.mark.skip(reason="Porting to geocodable API")
@pytest.mark.mock_redis
@pytest.mark.django_db
@given(response=locations())
@pytest.mark.filterwarnings("ignore::django.core.cache.backends.base.CacheKeyWarning")
def testUpdatePersonGeo(response, db, person, dummy_geocoder):
    """Test that processing a user's geocode result updates lat/lng properly"""
    dummy_geocoder.set_response(response)
    note('Raw: %r' % (response.raw,))
    note('Address: %r' % (response.address,))

    person.address = response.address
    person.save()
    person.refresh_from_db()

    if person.update_geo():
        assert person.lat == response.latitude
        assert person.lng == response.longitude
    else:
        assert person.lat is None
        assert person.lng is None

def assertValidResponse(resp, status=200):
    __tracebackhide__ = True
    assert resp.status_code == status
    return resp

@pytest.mark.mock_redis
@pytest.mark.django_db
def testPermissions(api_client, person):
    """Ensure that we do not have access to PII by default"""
    assertValidResponse(api_client.get('/api/people/'), 403)
    assertValidResponse(api_client.get('/api/people/'+quote_plus(person.email)+'/'), 403)

@pytest.mark.skip_auth
@pytest.mark.django_db
@given(emails().filter(lambda e: '/' not in e))
def testValidEmailURLs(api_client, email):
    """Test that all permutations of an email address generate a proper url"""
    url = reverse('person-detail', kwargs={'email': email})
    assertValidResponse(api_client.get(url), 404)

@pytest.mark.skip(reason="Buggy under pytest")
@pytest.mark.skip_auth
@pytest.mark.django_db
@given(person=peopleArgs(), newTag=nonblanks())
def testCreatePersonWithTag(api_client, settings, person, newTag):
    note('Email %s'%person['email'])
    person['tags'] = [newTag]
    note("Submit %r"%(person,))
    resp = assertValidResponse(api_client.post('/api/people/', 
            person, format='json'), 201).data
    note('Result %r'%(resp,))
    personName = person.get('name', None)
    if personName is not None:
        personName = personName.strip()
    else:
        personName = ''
    assert resp['tags'] == person['tags']
    assert resp['email'] == person['email']
    assert resp['name'] == personName

    person['tags'].append(newTag+'-added')
    resp = assertValidResponse(api_client.put('/api/people/'+person['email']+'/', 
            person, format='json'), 200).data
    assert resp['tags'] == person['tags']

@pytest.mark.django_db
def testExportPersonToMailchimp(person, settings):
    settings.MAILCHIMP_SECRET_KEY = '0' * 32
    settings.MAILCHIMP_LIST_ID = 'list-id'
    with patch('mailchimp3.entities.listmembers.ListMembers.create_or_update') as patched:
        exporter = exporting.MailchimpExporter()
        assert len(exporter) == 1
        page = iter(exporter).next()
        assert page.dict[0]['email'] == person.email
        exporter.export_page(page)
        patched.assert_called_with('list-id', '55502f40dc8b7c769880b10874abc9d0',
                dict(email_address=person.email, status_if_new='subscribed'))
