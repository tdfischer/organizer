# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from mock import MagicMock, patch
from hypothesis.extra.django import TestCase
from hypothesis.extra.django.models import models as djangoModels
from django.test import override_settings
from django.conf import settings
from django.contrib.auth.models import User
from urllib import quote_plus
from hypothesis import given, assume, note, settings as hypothesisSettings
import math
from hypothesis.strategies import characters, just, sampled_from, emails, floats, composite, lists, dictionaries, one_of, text, none, fixed_dictionaries
import string
from geopy.location import Location
from geopy.point import Point
from . import geocache, models, api_views
from rest_framework.test import APITestCase
import pytest
from address.models import Address
import functools


CONFIG = {
    'CACHES': {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache'
        }
    },
}


def mockRedis(f):
    @functools.wraps(f)
    @override_settings(**CONFIG)
    def wrapped(*args, **kwargs):
        with mockedQueue():
            return f(*args, **kwargs)
    return wrapped

def mockedQueue():
    return patch('django_rq.queues.get_queue')

def skipAuth(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        with patch('rest_framework.views.APIView.check_permissions') as patched:
            return f(*args, **kwargs)
    return wrapped

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

@composite
def defaultStates(draw):
    return models.PersonState.objects.get_or_create(name='Default')[0]

@composite
def people(draw):
    return models.Person.objects.create(
        name=draw(nonblanks()),
        email=draw(emails().filter(lambda x: len(x) < 100 and '/' not in x)),
        address=None,
        state=draw(defaultStates())
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

@override_settings(GEOCODE_ADAPTOR='crm.geocache.DummyAdaptor')
class GeocodeTests(TestCase):
    @given(geocodeTest)
    def testCountry(self, data):
        geocache.country(data)

    @given(geocodeTest)
    def testState(self, data):
        geocache.state(data)

    @given(geocodeTest)
    def testLocality(self, data):
        geocache.locality(data)

    @given(geocodeTest)
    def testTurf(self, data):
        geocache.turf(data)

    @given(fixed_dictionaries(geocodeDict))
    def testValidResponse(self, data):
        turf = geocache.turf(data)
        self.assertIsNotNone(turf)
        self.assertIsNotNone(turf.name)
        self.assertIsNotNone(turf.locality)

    @given(locations())
    def testDecoder(self, response):
        decoded = geocache.decode_response(response)
        self.assertEqual(response.latitude, decoded['lat'])
        self.assertEqual(response.longitude, decoded['lng'])
        turf = geocache.turf(decoded)

class PersonTests(TestCase):
    @mockRedis
    @given(emails(), locations(), djangoModels(models.PersonState))
    @pytest.mark.filterwarnings("ignore::django.core.cache.backends.base.CacheKeyWarning")
    def testUpdateGeo(self, email, response, defaultState):
        settings.GEOCODE_ADAPTOR = MagicMock()
        settings.GEOCODE_ADAPTOR.resolve.return_value = response
        note('Raw: %r' % (response.raw,))

        p = models.Person.objects.create(email=email, name=email,
                state=defaultState, address=response.address)
        if models.updatePersonGeo(p.id):
            p = models.Person.objects.get(pk=p.id)
            self.assertEqual(p.lat, response.latitude)
            self.assertEqual(p.lng, response.longitude)
        else:
            self.assertIsNone(p.lat)
            self.assertIsNone(p.lng)

class ApiTests(APITestCase, TestCase):
    def setUp(self):
        self.authUser = User.objects.create(username='test')

    def tearDown(self):
        self.authUser.delete()

    @mockRedis
    @given(people())
    def testPermissions(self, person):
        self.assertValidResponse(self.client.get('/api/people/'), 403)
        self.assertValidResponse(self.client.get('/api/people/'+quote_plus(person.email)+'/'), 403)
        self.assertValidResponse(self.client.get('/api/users/me/'), 403)
        self.assertValidResponse(self.client.get('/api/users/1/'), 403)

    @skipAuth
    @mockRedis
    @given(people())
    def testGetPersonByEmail(self, person):
        self.client.logout()
        quoted_url = '/api/people/' + quote_plus(person.email) + '/'
        note("URL: "+quoted_url)
        response = self.assertValidResponse(self.client.get(quoted_url), 200)
        self.assertEqual(response.data.get('email'), person.email)
        person.delete()
        self.assertValidResponse(self.client.get(quoted_url), 404)

    def assertValidResponse(self, resp, status=200):
        note('Response: %r' %(resp.data,))
        self.assertEqual(resp.status_code, status)
        return resp

    @given(djangoModels(User))
    def testGetSelfUser(self, otherUser):
        assume(self.authUser.id != otherUser.id)
        # Ensure we can't list anything without logging in
        self.assertValidResponse(self.client.get('/api/users/'), 403)
        anonUser = self.assertValidResponse(self.client.get('/api/users/me/'),
                403).data
        self.client.force_authenticate(user=self.authUser)
        self.assertValidResponse(self.client.get('/api/users/'), 200)
        myUser = self.assertValidResponse(self.client.get('/api/users/me/'),
                200).data
        otherUserData = self.assertValidResponse(self.client.get('/api/users/'+str(otherUser.id)+'/'),
                200).data

        self.assertEqual(myUser.get('id'), self.authUser.id)
        self.assertNotEqual(anonUser.get('id'), self.authUser.id)
        self.assertEqual(otherUserData.get('id'), otherUser.id)
        self.assertNotEqual(otherUserData.get('id'), self.authUser.id)

    @skipAuth
    @mockRedis
    @given(people(), nonblanks())
    def testAddPersonTag(self, person, newTag):
        quotedUrl = '/api/people/' + quote_plus(person.email) + '/'
        note('Email %s'%person.email)
        resp = dict(self.assertValidResponse(self.client.get(quotedUrl)).data)
        resp['tags'] = list(resp['tags']) + [newTag]
        note("Submit %r"%(resp,))
        resp = self.assertValidResponse(self.client.put(quotedUrl, 
                resp, format='json')).data
        self.assertEqual(resp['tags'], [newTag])
