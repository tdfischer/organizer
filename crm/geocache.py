from django.conf import settings
from django.core.cache import caches
from geopy.geocoders import GoogleV3, Nominatim
from address.models import Country, State, Locality
import crm.models

geocache = caches['default']

def geocode(address):
    if settings.GOOGLE_MAPS_KEY:
        geolocator = GoogleV3(settings.GOOGLE_MAPS_KEY)
    else:
        geolocator = Nominatim('Organizer')
    cachedAddr = geocache.get('geocache:' + address)
    if cachedAddr is None:
        geocoded = geolocator.geocode(address, exactly_one=True)
        values = {}
        for component in geocoded.raw['address_components']:
            values[component['types'][0]] = component['long_name']
        cachedAddr = {
            'raw': geocoded.address,
            'street_number': values.get('street_number', None),
            'route': values.get('route', None),
            'locality': values.get('locality', ''),
            'postal_code': values.get('postal_code', None),
            'state': values.get('administrative_area_level_1', None),
            'country': values.get('country', None),
            'neighborhood': values.get('neighborhood', None),
            'lat': geocoded.latitude,
            'lng': geocoded.longitude
        }
        geocache.set('geocache:' + address, cachedAddr)
    return cachedAddr

def turfForAddress(address):
    geocoded = geocode(address)
    if geocoded is not None:
        print geocoded
        country, newCountry = Country.objects.get_or_create(name=geocoded.get('country'))
        state, newState = State.objects.get_or_create(name=geocoded.get('state'),
                country=country)
        city, newCity = Locality.objects.get_or_create(name=geocoded.get('locality'),
                state=state)
        neighborhoodTurf, newNeighborhood = crm.models.Turf.objects.get_or_create(name=geocoded.get('neighborhood'),
                locality=city)
        return neighborhoodTurf
