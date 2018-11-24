from mock import patch
from hypothesis.extra.django import TestCase
from django.test import override_settings
from hypothesis import given, example
from hypothesis.strategies import characters, just, sampled_from, emails, floats, composite, lists, dictionaries, one_of, text, none, fixed_dictionaries
import pytest
from . import auth, exporting, importing
import os

@pytest.mark.skip
def testDiscourseLogin(client, settings):
    settings.DISCOURSE_BASE_URL='http://discourse-host/session/sso-provider'
    settings.DISCOURSE_SSO_SECRET='secret'
    with patch('social_core.backends.utils.get_backend') as patched:
        patched.return_value = auth.DiscourseSSOAuth
        resp = client.get('/login/discourse/')
        assert resp.status_code == 302
        assert resp.url.split('?')[0] == 'http://discourse-host/session/sso-provider'

@pytest.mark.django_db
def testDevLoginDisabledByDefault(client, settings):
    with patch('social_core.backends.utils.get_backend') as patched:
        patched.return_value = auth.LocalDevAuth
        settings.DEBUG = False
        settings.AUTHENTICATION_BACKENDS = ('organizer.auth.LocalDevAuth',)
        if 'USE_REALLY_INSECURE_DEVELOPMENT_AUTHENTICATION_BACKEND' in os.environ:
            del os.environ['USE_REALLY_INSECURE_DEVELOPMENT_AUTHENTICATION_BACKEND']
        resp = client.get('/login/local-dev/?next=/')
        assert resp.status_code == 302
        assert resp.url == 'http://testserver/complete/local-dev/'
        with pytest.raises(EnvironmentError):
            resp = client.get('/complete/local-dev/')
            assert resp.status_code == 500

@pytest.mark.django_db
@pytest.mark.redis_server
def testDevLogin(client, settings):
    with patch('social_core.backends.utils.get_backend') as patched:
        patched.return_value = auth.LocalDevAuth
        settings.DEBUG = True
        settings.AUTHENTICATION_BACKENDS = ('organizer.auth.LocalDevAuth',)
        os.environ['USE_REALLY_INSECURE_DEVELOPMENT_AUTHENTICATION_BACKEND'] = 'yes'
        resp = client.get('/login/local-dev/?next=/')
        assert resp.status_code == 302
        assert resp.url == 'http://testserver/complete/local-dev/'
        resp = client.get('/complete/local-dev/')
        assert resp.status_code == 302

def testDevGetUserDetails():
    authBackend = auth.LocalDevAuth()
    ret = authBackend.get_user_details(None)
    assert len(ret.keys()) == 4
    assert ret['is_staff']
    assert ret['is_superuser']

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
