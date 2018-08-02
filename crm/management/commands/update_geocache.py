from django.core.management.base import BaseCommand, CommandError
from geopy.geocoders import GoogleV3, Nominatim
from geopy.exc import GeocoderQueryError, GeocoderTimedOut
from django.core.cache import caches
from crm.models import Person, Turf, TurfMembership
from django.conf import settings
from address.models import Country, State, Locality

geocache = caches['default']

class Command(BaseCommand):
    def handle(self, *args, **options):
        if settings.GOOGLE_MAPS_KEY:
            geolocator = GoogleV3(settings.GOOGLE_MAPS_KEY)
        else:
            geolocator = Nominatim('Organizer')
        for person in Person.objects.all():
            currentAddr = person.address.raw
            cachedAddr = geocache.get('geocache:' + person.address.raw)
            longitude = None
            latittude = None
            if cachedAddr is None:
                geocoded = None
                try:
                    geocoded = geolocator.geocode(currentAddr, exactly_one=True)
                except GeocoderTimedOut:
                    pass
                except GeocoderQueryError:
                    pass
                if geocoded is not None:
                    longitude = geocoded.longitude
                    latitude = geocoded.latitude
                    print "Resolved", currentAddr, '->', geocoded.address
                    values = {}
                    for component in geocoded.raw['address_components']:
                        values[component['types'][0]] = component['long_name']
                    person.address = {
                        'raw': geocoded.address,
                        'street_number': values.get('street_number', None),
                        'route': values.get('route', None),
                        'locality': values.get('neighborhood', '') + ', ' + values.get('locality', ''),
                        'postal_code': values.get('postal_code', None),
                        'administrative_area_level_1': values.get('administrative_area_level_1', None),
                        'country': values.get('country', None),
                    }
                    if values.get('neighborhood') is not None:
                        country, newCountry = Country.objects.get_or_create(name=values.get('country'))
                        state, newState = State.objects.get_or_create(name=values.get('administrative_area_level_1'),
                                country=country)
                        city, newCity = Locality.objects.get_or_create(name=values.get('locality'),
                                state=state)
                        neighborhoodTurf, newNeighborhood = Turf.objects.get_or_create(name=values.get('neighborhood'),
                                locality=city)
                        neighborhoodMembership, joinedNeighborhood = TurfMembership.objects.get_or_create(turf=neighborhoodTurf,
                                person=person)
                        if newCountry:
                            print "New country:", country.name
                        if newState:
                            print "New state:", state.name
                        if newCity:
                            print "New city:", city.name
                        if newNeighborhood:
                            print "New neighborhood:", neighborhoodTurf.name
                        if joinedNeighborhood:
                            print person, "joined neighborhood:", neighborhoodTurf.name
                    geocache.set('geocache:' + currentAddr, {'longitude': longitude,
                        'latitude': latitude})
            else:
                longitude = cachedAddr['longitude']
                latitude = cachedAddr['latitude']

            if longitude is not None:
                person.lng = longitude
                person.lat = latitude
                person.save()
            else:
                print "Could not resolve", currentAddr
