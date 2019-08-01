from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from organizer.viewsets import IntrospectiveViewSet
from . import models, serializers

class EventViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = models.Event.objects.all()
    serializer_class = serializers.EventSerializer

views = {
    'events': EventViewSet
}
