import logging
import csv
from . import models
from geopy.geocoders import GoogleV3
from django.conf import settings
import itertools
from airtable import Airtable

__addr_cache = {}

def translate_google_result(res):
    ret = {}
    for prop in res['address_components']:
        if 'locality' in prop['types']:
            ret['locality'] = prop['long_name']
        if 'administrative_area_level_1' in prop['types']:
            ret['state'] = prop['long_name']
        if 'country' in prop['types']:
            ret['country'] = prop['long_name']
        if 'postal_code' in prop['types']:
            ret['postal_code'] = prop['long_name']
    ret['raw'] = res['formatted_address']
    return ret

def address_from_row(row):
    geocoder = GoogleV3(settings.GOOGLE_MAPS_API_KEY)
    addr_to_geocode = ""
    if 'full_address' in row and len(row['full_address']) > 0:
        addr_to_geocode = row['address']
    elif 'zipcode' in row and len(row['zipcode']) > 0:
        addr_to_geocode = row['zipcode']
    elif 'city' in row and len(row['city']) > 0:
        addr_to_geocode = row['city']
    if addr_to_geocode is None:
        logging.debug("Could not find suitable geocode field")
        return None
    if addr_to_geocode not in __addr_cache:
        geocoded = None
        try:
            geocoded = geocoder.geocode(addr_to_geocode)
        except:
            pass
        if geocoded:
            ret = translate_google_result(geocoded.raw)
            __addr_cache[addr_to_geocode] = ret
        else:
            __addr_cache[addr_to_geocode] = addr_to_geocode
    logging.debug("%s -> %r", addr_to_geocode, __addr_cache[addr_to_geocode])
    return __addr_cache[addr_to_geocode]

def import_file(f):
    imp = Importer(f)
    imported_count = 0
    for activist in imp:
        print 'Imported ', unicode(activist)
        imported_count += 1
    return imported_count

class Importer(object):
    def __init__(self):
        self.__imported_count = 0

    def __iter__(self):
        return self

    def next(self):
        activist, created = self.import_next()
        if created:
            self.__imported_count += 1
        return activist, created

class CSVImporter(Importer):
    def __init__(self, src_file):
        super(CSVImporter, self).__init__()
        self.__reader = csv.DictReader(src_file)

    def import_next(self):
        row = self.__reader.next()
        geocoded_addr = address_from_row(row)
        return models.Person.objects.update_or_create(email=row['email'],
                defaults={'name': "%s %s"%(row['first_name'],
                    row['last_name']), 'address': geocoded_addr})

class AirtableImporter(Importer):
    def __init__(self):
        super(AirtableImporter, self).__init__()
        self.__airtable = Airtable(
                settings.AIRTABLE_BASE_ID,
                'Members and Volunteers',
                api_key=settings.AIRTABLE_API_KEY)
        self.__members = iter(self.__airtable.get_all(view='Everyone'))

    def import_next(self):
        while True:
            row = self.__members.next()
            try:
                return models.Person.objects.update_or_create(
                        email=row['fields']['Email'],
                        defaults={
                            'name': row['fields']['Name'],
                            'address': row['fields']['Full Address']
                        })
            except KeyError, e:
                pass
