from django.conf import settings
from django.core.cache import caches
from geopy.geocoders import GoogleV3
from geopy.location import Location
from geopy.exc import GeocoderQueryError
from address.models import Country, State, Locality
import importlib
import crm.models

class GeocodeAdaptor(object):
    def resolve(self, address):
        return self.geolocator.geocode(address, exactly_one=True)

class DummyAdaptor(GeocodeAdaptor):
    def resolve(self, address):
        return Location(None, None, {})

class GoogleAdaptor(GeocodeAdaptor):
    def __init__(self):
        self.geolocator = GoogleV3(settings.GOOGLE_MAPS_KEY)

def decode_response(response):
    values = {}
    for component in response.raw.get('address_components', []):
        values[component['types'][0]] = component['long_name']
    return {
        'raw': response.address,
        'street_number': values.get('street_number', ''),
        'route': values.get('route', ''),
        'locality': values.get('locality', ''),
        'postal_code': values.get('postal_code', ''),
        'state': values.get('administrative_area_level_1', ''),
        'country': values.get('country', ''),
        'neighborhood': values.get('neighborhood', None),
        'lat': response.latitude,
        'lng': response.longitude,
    }

def geocode(address):
    if type(settings.GEOCODE_ADAPTOR) is str:
        module, cls = settings.GEOCODE_ADAPTOR.rsplit('.', 1)
        Adaptor = getattr(importlib.import_module(module), cls)
        adaptor = Adaptor()
    else:
        adaptor = settings.GEOCODE_ADAPTOR
    geocache = caches['default']
    cachedAddr = geocache.get('geocache:' + address)
    if cachedAddr is None:
        try:
            cachedAddr = decode_response(adaptor.resolve(address))
        except GeocoderQueryError:
            # FIXME: Log geocoder failure
            return None
        geocache.set('geocache:' + address, cachedAddr)
    return cachedAddr

def country(data):
    return Country.objects.get_or_create(name=data.get('country') or 'Earth')[0]

def state(data):
    return State.objects.get_or_create(name=data.get('state') or 'National',
            country=country(data))[0]

def locality(data):
    return Locality.objects.get_or_create(
        name = data.get('locality') or 'State-wide',
        postal_code = data.get('postal_code') or '',
        state = state(data)
    )[0]

def turf(data):
    # We need a minimum of a zipcode to invent a turf, for now.
    # This implies we also know city, state, country.
    return crm.models.Turf.objects.get_or_create(
        name = data.get('neighborhood') or (data.get('postal_code') or 'State-wide'),
        locality = locality(data)
    )[0]


def turfForAddress(address):
    geocoded = geocode(address)
    if geocoded is not None:
        return turf(geocoded)
