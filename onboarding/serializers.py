from rest_framework import serializers, relations
from crm.serializers import PersonSerializer
from . import models
from events.models import Event

class SignupSerializer(serializers.HyperlinkedModelSerializer):
    event = serializers.SlugRelatedField(
            queryset=Event.objects.all(), slug_field='id', required=False)
    class Meta:
        model = models.Signup
        fields = ('id', 'email', 'url', 'approved', 'created', 'event')
