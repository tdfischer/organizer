from hypothesis.extra.django import TestCase
from django.test import override_settings
from hypothesis import given, example
from hypothesis.strategies import characters, just, sampled_from, emails, floats, composite, lists, dictionaries, one_of, text, none, fixed_dictionaries
from . import auth

class DiscourseAuthTests(TestCase):
    @override_settings(
        DISCOURSE_BASE_URL='http://discourse-host/session/sso-provider',
        DISCOURSE_SSO_SECRET='secret'
    )
    def testLogin(self):
        resp = self.client.get('/login/discourse/')
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(resp.url.split('?')[0], 'http://discourse-host/session/sso-provider')

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
    def testGetUserDetails(self, response):
        authBackend = auth.DiscourseSSOAuth()
        ret = authBackend.get_user_details(response)
        self.assertTrue(len(ret.keys()) == 6)
