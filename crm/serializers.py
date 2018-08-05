from rest_framework import serializers, relations
from . import models
from django.contrib.auth.models import User
from taggit_serializer.serializers import TagListSerializerField, TaggitSerializer
import address

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'id')


class LocalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = address.models.Locality
        fields = ('name', 'postal_code')

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = address.models.Address
        fields = ('raw', 'street_number', 'route', 'locality')

class TurfSerializer(serializers.HyperlinkedModelSerializer):
    locality = LocalitySerializer()

    class Meta:
        model = models.Turf
        fields = ('name', 'locality', 'url', 'id')

class TurfMembershipSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='turf.name', read_only=True)
    turf = serializers.PrimaryKeyRelatedField(read_only=True)
    url = serializers.HyperlinkedRelatedField(source='turf', queryset=models.Turf.objects.all(),
    view_name='turf-detail')

    class Meta:
        model = models.TurfMembership
        fields = ('name', 'joined_on', 'is_captain', 'turf', 'url')

class PersonStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PersonState
        fields = ('name', 'id')
        lookup_field = 'name'
        extra_kwargs = {
                'id': {'read_only': True}
        }

class PersonStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PersonState
        fields = ('name', 'id')
        lookup_field = 'name'
        extra_kwargs = {
                'id': {'read_only': True}
        }

class PersonSerializer(TaggitSerializer, serializers.HyperlinkedModelSerializer):
    tags = TagListSerializerField()
    current_turf_membership = TurfMembershipSerializer(read_only=True)
    turf_memberships = TurfMembershipSerializer(many=True, read_only=True)
    state = serializers.SlugRelatedField(queryset=models.PersonState.objects.all(),
            slug_field='name')

    class Meta:
        model = models.Person
        fields = ('name',  'id', 'email', 'created', 'url', 'tags',
        'geo', 'current_turf_membership', 'turf_memberships', 'state')

        lookup_field = 'email'
        extra_kwargs = {
                'url': {'lookup_field': 'email'},
                'id': {'source': 'email', 'read_only': True},
                'geo': {'read_only': True}
        }
