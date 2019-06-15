from rest_framework import serializers, relations
from . import models
from django.contrib.auth.models import User, Group, Permission
from taggit_serializer.serializers import TagListSerializerField, TaggitSerializer
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from geocodable.models import Location, LocationAlias, LocationType
from geocodable.serializers import GeoSerializer

class UserSerializer(serializers.HyperlinkedModelSerializer):
    groups = serializers.SlugRelatedField(many=True, queryset=Group.objects.all(),
            slug_field='name')
    permissions = serializers.SerializerMethodField()

    def get_permissions(self, obj):
        return map(lambda x: x.name,
                Permission.objects.filter(group__in=obj.groups.all()))

    class Meta:
        model = User
        fields = ('email', 'id', 'is_staff', 'is_superuser', 'groups',
        'permissions')


class PersonSerializer(TaggitSerializer, serializers.HyperlinkedModelSerializer):
    tags = TagListSerializerField()
    geo = GeoSerializer(allow_null=True, required=False)
    twelve_month_event_count = serializers.SerializerMethodField()
    twelve_month_donation_value = serializers.SerializerMethodField()

    def get_twelve_month_donation_value(self, obj):
        oneYearAgo = timezone.now() + timedelta(days=-365)
        return obj.donations.filter(timestamp__gte=oneYearAgo).aggregate(Sum('value'))['value__sum']

    def get_twelve_month_event_count(self, obj):
        oneYearAgo = timezone.now() + timedelta(days=-365)
        return obj.events.filter(end_timestamp__gte=oneYearAgo).count()

    def to_internal_value(self, data):
        if 'location' in data and (data['location'] is None or len(data['location']) == 0):
            del data['location']
        return super(PersonSerializer, self).to_internal_value(data)

    def update(self, instance, validated_data):
        if 'location' in validated_data:
            instance.location = LocationAlias.objects.fromRaw(validated_data.pop('location'))
        return super(PersonSerializer, self).update(instance, validated_data)

    def create(self, validated_data):
        valid_address = LocationAlias.objects.fromRaw(validated_data.pop('location', None))
        return models.Person.objects.create(location=valid_address, **validated_data)

    class Meta:
        model = models.Person
        fields = ('name',  'id', 'email', 'created', 'url', 'tags',
        'geo', 'phone',
        'twelve_month_event_count', 'twelve_month_donation_value')

        lookup_field = 'email'
        extra_kwargs = {
                'url': {'lookup_field': 'email'},
                'name': {'required': False, 'allow_null': True},
                'id': {'source': 'email', 'read_only': True},
                'geo': {'source': 'location'},
                'phone': {'write_only': True},
        }
