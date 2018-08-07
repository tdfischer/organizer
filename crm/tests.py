# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from hypothesis.extra.django import TestCase
from django.test import override_settings
from django.conf import settings
from hypothesis import given, assume, note
import math
from hypothesis.strategies import sampled_from, emails, floats, composite, lists, dictionaries, one_of, text, none, fixed_dictionaries
import string
from geopy.location import Location
from geopy.point import Point
from . import geocache, models

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

class DummyAdaptor(geocache.GeocodeAdaptor):
    def __init__(self, response):
        self.response = response

    def resolve(self, address):
        return self.response

@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.dummy.DummyCache'}})
class PersonTests(TestCase):
    def setUp(self):
        self.defaultState, _ = models.PersonState.objects.get_or_create(name='Default')
        # Monkeypatch this to not create redis jobs
        models.Person.queue_geocache_update = lambda _: None

    @given(emails(), locations())
    def testUpdateGeo(self, email, response):
        settings.GEOCODE_ADAPTOR = DummyAdaptor(response)
        note('Raw: %r' % (response.raw,))

        p = models.Person.objects.create(email=email, name=email,
                state=self.defaultState, address=response.address)
        p.save()
        if models.updatePersonGeo(p.id):
            p = models.Person.objects.get(pk=p.id)
            self.assertEqual(p.lat, response.latitude)
            self.assertEqual(p.lng, response.longitude)
        else:
            self.assertIsNone(p.lat)
            self.assertIsNone(p.lng)
