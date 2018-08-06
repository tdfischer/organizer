from rest_framework.permissions import IsAuthenticated
from . import models, serializers

from organizer.viewsets import IntrospectiveViewSet

class BroadcastViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = models.Broadcast.objects.all()
    serializer_class = serializers.BroadcastSerializer

    def get_serializer_context(self):
        return {'user': self.request.user}

views = {
    'broadcasts': BroadcastViewSet,
}
