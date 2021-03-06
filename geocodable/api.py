from django.conf import settings
from django.core.cache import caches
from geopy.geocoders import GoogleV3
from geopy.location import Location
from geopy.exc import GeocoderQueryError
import importlib
import logging

logger = logging.getLogger(__name__)

class GeocodeAdaptor(object):
    def resolve(self, address):
        return self.geolocator.geocode(address, exactly_one=True)

class DummyAdaptor(GeocodeAdaptor):
    def __init__(self):
        self.responses = {}

    def reset(self):
        logger.info("Resetting adaptor")
        self.responses = {}

    def set_response(self, query, response):
        logger.info("Setting %r to %r", query, response)
        self.responses[query] = response

    def resolve(self, address):
        if address not in self.responses:
            raise GeocoderQueryError
        else:
            return self.responses[address]

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

def get_adaptor():
    module, cls = settings.GEOCODE_ADAPTOR.rsplit('.', 1)
    Adaptor = getattr(importlib.import_module(module), cls)
    return Adaptor()

def geocode(address):
    adaptor = get_adaptor()
    geocache = caches['default']
    cachedAddr = geocache.get('geocache:' + address)
    if cachedAddr is None:
        logger.info("Cache miss for %s", address)
        try:
            cachedAddr = decode_response(adaptor.resolve(address))
        except GeocoderQueryError:
            pass
            # FIXME: Log geocoder failure
            #logger.info("Geocode failure")
            #return None
    geocache.set('geocache:' + address, cachedAddr)
    logger.info('Geocoded %r to %r', address, cachedAddr)
    return cachedAddr
