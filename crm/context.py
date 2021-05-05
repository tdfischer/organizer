from . import serializers
from django.conf import settings
import json

def add_user_data(request):
    user_serializer = serializers.UserSerializer(request.user,
            context={'request': request})
    user_data = user_serializer.data
    user_data['permissions'] = list(user_data.get('permissions', []))
    return {
        'user_data': json.dumps(user_data)
    }

def add_settings(request):
    return {
        'settings': settings
    }
