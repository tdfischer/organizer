from rest_framework import serializers, relations
from crm.serializers import AddressSerializer, PersonSerializer
from . import models
from crm.models import Person

class EventSerializer(serializers.HyperlinkedModelSerializer):
    location = AddressSerializer(read_only=True)
    attendees = serializers.SlugRelatedField(many=True,
            queryset=Person.objects.all(), slug_field='email')

    def update(self, event, validated_data):
        attendees_data = validated_data.pop('attendees')
        print attendees_data, event, validated_data
        for attr, value in validated_data.iteritems():
            setattr(event, attr, value)
        event.attendees = attendees_data
        event.save()
        return event

    class Meta:
        model = models.Event
        fields = ('id', 'url', 'timestamp', 'end_timestamp', 'uid', 'location', 'instance_id',
                'attendees', 'name', 'geo')
        extra_kwargs = {
            'geo': {'read_only': True}
        }
