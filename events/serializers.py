from rest_framework import serializers, relations
from crm.serializers import PersonSerializer
from geocodable.serializers import GeoSerializer
from . import models
from crm.models import Person

class EventSerializer(serializers.HyperlinkedModelSerializer):
    geo = GeoSerializer(read_only=True)
    attendee_count = serializers.SerializerMethodField()
    user_has_checked_in = serializers.SerializerMethodField()

    def get_attendee_count(self, event):
        return event.signups.filter(approved=False).count() + event.attendees.count()

    def get_user_has_checked_in(self, event):
        user = self.context['request'].user
        if user is not None and not user.is_anonymous:
            email = user.email
            return event.signups.filter(email=email).exists() or event.attendees.filter(email=email).exists()
        else:
            return False

    class Meta:
        model = models.Event
        fields = ('id', 'url', 'timestamp', 'end_timestamp', 'uid', 'location', 'instance_id',
                'attendee_count', 'user_has_checked_in', 'name', 'geo')
        extra_kwargs = {
            'geo': {'read_only': True}
        }
