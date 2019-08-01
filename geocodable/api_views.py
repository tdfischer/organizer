from rest_framework.permissions import IsAuthenticated
from . import models, serializers
from organizer.viewsets import IntrospectiveViewSet

class LocationViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = models.Location.objects.all()
    serializer_class = serializers.LocationSerializer

class LocationAliasViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = models.LocationAlias.objects.all()
    serializer_class = serializers.GeoSerializer

views = {
    'locations': LocationViewSet,
    'locationaliases': LocationAliasViewSet
}
