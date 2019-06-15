from rest_framework import serializers
from . import models

class LocationSerializer(serializers.HyperlinkedModelSerializer):
    type = serializers.SerializerMethodField()

    def get_type(self, obj):
        if obj.type is None:
            return None
        return obj.type.value

    class Meta:
        model = models.Location
        fields = ('name', 'parent', 'id', 'fullName', 'type', 'lat', 'lng')

class GeoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.LocationAlias
        fields = ('lat', 'lng', 'fullName')
