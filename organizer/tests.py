from mock import patch
from hypothesis.extra.django import TestCase
from django.test import override_settings
from hypothesis import given, example
from hypothesis.strategies import characters, just, sampled_from, emails, floats, composite, lists, dictionaries, one_of, text, none, fixed_dictionaries
import pytest
from . import auth, exporting, importing

@pytest.mark.skip
def testDiscourseLogin(client, settings):
    settings.DISCOURSE_BASE_URL='http://discourse-host/session/sso-provider'
    settings.DISCOURSE_SSO_SECRET='secret'
    with patch('social_core.backends.utils.get_backend') as patched:
        patched.return_value = auth.DiscourseSSOAuth
        resp = client.get('/login/discourse/')
        assert resp.status_code == 302
        assert resp.url.split('?')[0] == 'http://discourse-host/session/sso-provider'

# Sentry #EBF-ORGANIZER-2R
@example({
    'admin': [
        'false'
    ], 
    'email': [
        'foo.bar@gmail.com'
    ], 
    'external_id': [
        '228'
    ], 
    'groups': [
        'trust_level_0,trust_level_1'
    ], 
    'moderator': [
        'false'
    ], 
    'nonce': [
        '81098579'
    ], 
    'return_sso_url': [
        'http://organizing.eastbayforeveryone.org/complete/discourse/'
    ], 
    'username': [
        'BronzedWing'
    ]})
@given(dictionaries(text(), lists(text())))
def testDiscourseGetUserDetails(response):
    authBackend = auth.DiscourseSSOAuth()
    ret = authBackend.get_user_details(response)
    assert len(ret.keys()) == 6

def testCollectExporters():
    exporters = exporting.collect_exporters()
    for (exporterName, exporter) in exporters.iteritems():
        assert exporting.get_exporter_class(exporterName) == exporter

@pytest.mark.parameterize("exporterCls", exporting.collect_exporters())
def verifyExporter(exporterCls):
    exporter = exporterCls()
    assert iter(exporter)

def testCollectImporters():
    importers = importing.collect_importers()
    for (importerName, importer) in importers.iteritems():
        assert importing.get_importer_class(importerName) == importer
