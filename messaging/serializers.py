from rest_framework import serializers, relations
from django.contrib.auth.models import User

from . import models
from crm.models import Turf, PersonState

class BroadcastSerializer(serializers.HyperlinkedModelSerializer):
    target_state = serializers.SlugRelatedField(queryset=PersonState.objects.all(), slug_field='name')
    turf = serializers.PrimaryKeyRelatedField(queryset=Turf.objects.all())
    author = serializers.CharField(source='author.email', required=False,
            read_only=True)

    def create(self, validated_data):
        validated_data['author'] = self.context.get('user')
        return super(BroadcastSerializer, self).create(validated_data)

    class Meta:
        model= models.Broadcast
        fields = ('subject', 'body', 'turf', 'sent_on', 'id', 'author',
        'target_state')
        extra_kwargs = {
            'sent_on': {'required': False, 'read_only': True}
        }
