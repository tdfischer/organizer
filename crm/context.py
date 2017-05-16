from . import serializers
from django.conf import settings
import json

def add_user_data(request):
    user_serializer = serializers.UserSerializer(request.user,
            context={'request': request})
    return {
        'user_data': json.dumps(user_serializer.data)
    }

def add_settings(request):
    return {
        'settings': settings
    }
