import pytest
from mock import patch
from hypothesis import settings, Verbosity
import os
import crm.models
from django.test import override_settings
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
import subprocess
from geocodable.api import DummyAdaptor

settings.register_profile("ci", max_examples=300)
settings.register_profile("dev", max_examples=10)
settings.register_profile("debug", max_examples=10, verbosity=Verbosity.verbose)
settings.load_profile(os.getenv('HYPOTHESIS_PROFILE', 'default'))

DUMMY_CACHE_CONFIG = {
    'CACHES': {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache'
        }
    },
}

DUMMY_SERVER_CONFIG = {
    'CACHES': {
        'default': {
            'BACKEND': 'redis_cache.RedisCache',
            'LOCATION': 'redis://localhost:6379/0'
        }
    },
    'RQ_QUEUES': {
        'default': {
            'USE_REDIS_CACHE': 'default',
            'ASYNC': False
        }
    }
}

@pytest.fixture
def default_personstate():
    return crm.models.PersonState.objects.get_or_create(name='Default')[0]

@pytest.fixture(scope="session")
def redis_server(request):
    proc = subprocess.Popen('redis-server')
    override = override_settings(**DUMMY_SERVER_CONFIG)
    override.enable()
    request.addfinalizer(proc.kill)
    request.addfinalizer(override.disable)

@pytest.fixture
def redis_queue(request):
    patched = patch('django_rq.queues.get_queue')
    override = override_settings(**DUMMY_CACHE_CONFIG)
    override.enable()
    mock = patched.start()
    mock.reset_mock()
    request.addfinalizer(patched.stop)
    request.addfinalizer(override.disable)
    return mock.return_value

@pytest.fixture
def test_user():
    return User.objects.create(email='test@test.org')

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture(autouse=True)
def _mock_skipped_auth(request):
    marker = request.node.get_closest_marker('skip_auth')
    if marker:
        patched = patch('rest_framework.views.APIView.check_permissions')
        patched.start()
        request.addfinalizer(patched.stop)

@pytest.fixture(autouse=True)
def _disable_ssl(request):
    override = override_settings(SECURE_SSL_REDIRECT=False)
    override.enable()
    request.addfinalizer(override.disable)
    return None

@pytest.fixture(autouse=True)
def _mock_redis_markers(request):
    marker = request.node.get_closest_marker('mock_redis')
    if marker:
        request.getfixturevalue("redis_queue")

    marker = request.node.get_closest_marker('redis_server')
    if marker:
        request.getfixturevalue("redis_server")

@pytest.fixture
def dummy_geocoder(request):
    patched = patch('geocodable.api.get_adaptor')
    mock = patched.start()
    mock.return_value = DummyAdaptor()
    request.addfinalizer(patched.stop)
    return mock.return_value

@pytest.fixture(autouse=True)
def _mock_geocoder(request):
    marker = request.node.get_closest_marker('mock_geocoder')
    if marker:
        request.getfixturevalue('dummy_geocoder')
