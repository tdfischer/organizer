# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.test import TestCase
from hypothesis import reproduce_failure, given, assume, note, settings as hypothesisSettings
from hypothesis.strategies import characters, just, sampled_from, emails, integers, floats, composite, lists, dictionaries, one_of, text, none, fixed_dictionaries
from geopy.location import Location
from geopy.point import Point
import string
import pytest
from . import api, models

@composite
def latlngs(draw):
    # We use integers to avoid floating point comparisons breaking things that
    # don't matter
    return {
        'lat': draw(integers(min_value=-90, max_value=90)),
        'lng': draw(integers(min_value=-180, max_value=180))
    }

printable = lambda: text(alphabet=string.printable)

@composite
def geocodeResponses(draw):
    latlng = draw(latlngs())
    ret = draw(fixed_dictionaries({
        'raw': printable(),
        'street_number': printable(),
        'route': printable(),
        'locality': printable(),
        'postal_code': text(alphabet=('-',) + tuple(string.digits)),
        'state': printable(),
        'country': printable(),
        'neighborhood': printable(),
    }))
    ret.update(latlng)
    return ret

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
        'long_name': draw(printable()),
        'short_name': draw(printable())
    }

@composite
def googleResponses(draw):
    loc = draw(latlngs())
    return {
        'formatted_address': draw(printable()),
        'place_id': draw(printable()),
        'geometry': {
            'location': loc,
            'viewport': {
                'northeast': loc,
                'southwest': loc,
            },
            'bounds': {
                'northeast': loc,
                'southwest': loc
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

@pytest.mark.django_db
@given(locations())
def testDecoder(response):
    decoded = api.decode_response(response)
    assert response.latitude == decoded['lat']
    assert response.longitude == decoded['lng']

@pytest.mark.mock_redis
@pytest.mark.django_db
@given(response=geocodeResponses())
@pytest.mark.filterwarnings("ignore::django.core.cache.backends.base.CacheKeyWarning")
def testCreateLocationFromResponse(response):
    """Test that updating a location alias' raw value updates lat/lng properly"""
    location = models.Location.objects.fromResponse(response)

    note("Response: %r"%(response,))
    assert location is not None
    assert location.lat == response['lat']
    assert location.lng == response['lng']

    typeMap = {
        'country': models.LocationType.COUNTRY,
        'state': models.LocationType.STATE,
        'locality': models.LocationType.LOCALITY,
        'postal_code': models.LocationType.POSTAL_CODE,
        'route': models.LocationType.ROUTE,
        'neighborhood': models.LocationType.NEIGHBORHOOD,
        'street_number': models.LocationType.STREET_ADDRESS,
    }

    tree = location.get_ancestors(include_self=True)

    for k,v in typeMap.iteritems():
        if response.get(k) is not None:
            assert tree.filter(type=v, name=response.get(k)).exists()
        else:
            assert not tree.filter(type=v, name=response.get(k)).exists()

@pytest.mark.mock_redis
@pytest.mark.django_db
@pytest.mark.filterwarnings("ignore::django.core.cache.backends.base.CacheKeyWarning")
def testResolveAliasFailure(db, dummy_geocoder):
    """Test that a geocoder failure does not resolve an alias"""
    alias = models.LocationAlias(raw="Location")
    assert alias.location is None
    assert alias.resolve() == True
    assert alias.location is None
    assert alias.resolve() == False

@pytest.mark.mock_redis
@pytest.mark.django_db
@given(response=locations(), secondResponse=locations())
@pytest.mark.filterwarnings("ignore::django.core.cache.backends.base.CacheKeyWarning")
def testResolveAlias(response, secondResponse, dummy_geocoder):
    """Test an alias can resolve to a location"""
    assume(response.latitude != secondResponse.latitude)
    assume(response.longitude != secondResponse.longitude)

    dummy_geocoder.reset()
    dummy_geocoder.set_response('Location', response)
    dummy_geocoder.set_response('Something Else', secondResponse)

    # Clear the DB which pytest won't do for some reason
    models.LocationAlias.objects.all().delete()
    models.Location.objects.all().delete()

    # fromRaw with a decodable location should return an alias that can be
    # resolved
    alias = models.LocationAlias.objects.fromRaw('Location')
    assert alias.resolve() == True
    assert alias.location is not None
    assert alias.lat == response.latitude
    assert alias.lng == response.longitude
    assert alias.raw == alias.nonce

    # Calling resolve on an already resolved alias should do nothing and change
    # nothing
    assert alias.resolve() == False

    # Shouldn't update lat/lng until we set the raw field
    assert alias.lat != secondResponse.latitude
    assert alias.lng != secondResponse.longitude
    assert alias.raw == alias.nonce

    # Should update values once we set the raw field
    alias.raw = "Something Else"
    assert alias.resolve() == True
    assert alias.lat == secondResponse.latitude
    assert alias.lng == secondResponse.longitude
    assert alias.raw == alias.nonce
