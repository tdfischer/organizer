import os
from social_core.backends.base import BaseAuth
from social_core.backends.oauth import BaseOAuth2
from social_core.exceptions import AuthException
from hashlib import sha256
import hmac
from base64 import b64encode, b64decode
import urllib
import urllib.parse
from crm.models import Person
from django.conf import settings
from django.contrib.auth.models import User

from django.conf import settings

class TypeformAuth(BaseOAuth2):
    name = 'typeform'
    AUTHORIZATION_URL = 'https://api.typeform.com/oauth/authorize'
    ACCESS_TOKEN_URL = 'https://api.typeform.com/oauth/token'
    SCOPE_SEPARATOR = ','

    def get_user_details(self, response):
        return {'username': response.get('alias'),
                'email': response.get('email')}

    def user_data(self, access_token, *args, **kwargs):
        url = 'https://api.typeform.com/me?' + urllib.urlencode({
            'access_token': access_token
        })
        return self.get_json(url)

class DiscourseSSOAuth(BaseAuth):
    name = 'discourse'

    def auth_url(self):
        returnUrl = self.redirect_uri
        nonce = str(81098579)
        payload = "nonce="+nonce+"&return_sso_url="+returnUrl
        base64Payload = b64encode(payload)
        payloadSignature = hmac.new(settings.DISCOURSE_SSO_SECRET, base64Payload,
                sha256).hexdigest()
        encodedParams = urllib.urlencode({'sso': base64Payload, 'sig':
            payloadSignature})
        return settings.DISCOURSE_BASE_URL+"/session/sso_provider?"+encodedParams

    def get_user_id(self, details, response):
        return response['email'][0]

    def get_user_details(self, response):
        flattened = {}
        for (k, v) in response.iteritems():
            if len(v) > 0:
                flattened[k] = v[0]

        return {
            'username': flattened.get('username'),
            'email': flattened.get('email'),
            'name': flattened.get('name'),
            'groups': flattened.get('groups', '').split(','),
            'is_staff': flattened.get('admin') == 'true' or flattened.get('moderator') == 'true',
            'is_superuser': flattened.get('admin') == 'true',
        }

    def auth_complete(self, request, *args, **kwargs):
        ssoParams = request.GET.get('sso')
        ssoSignature = request.GET.get('sig')
        paramSignature = hmac.new(settings.DISCOURSE_SSO_SECRET, ssoParams, sha256).hexdigest()

        if not hmac.compare_digest(str(ssoSignature), str(paramSignature)):
            raise AuthException('Could not verify discourse login')

        decodedParams = b64decode(ssoParams)
        kwargs.update({'sso':'', 'sig': '', 'backend': self, 'response':
            urllib.parse.parse_qs(decodedParams)})

        return self.strategy.authenticate(*args, **kwargs)

class LocalDevAuth(BaseAuth):
    name = 'local-dev'

    def auth_url(self):
        return self.redirect_uri

    def get_user_id(self, details, response):
        return 1

    def get_user_details(self, response):
        return {
            'username': 'test',
            'email': 'test@localhost',
            'is_staff': True,
            'is_superuser': True,
        }

    def auth_complete(self, request, *args, **kwargs):
        if not (settings.DEBUG and ('USE_REALLY_INSECURE_DEVELOPMENT_AUTHENTICATION_BACKEND' in
                os.environ)):
            raise EnvironmentError("LocalDevAuth was used inappropriately.")
        kwargs.update({'sso': '', 'sig': '', 'backend': self, 'response': {}})
        return self.strategy.authenticate(*args, **kwargs)
