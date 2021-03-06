from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from crm.api_views import IntrospectiveViewSet
from . import models, serializers

class SignupViewSet(IntrospectiveViewSet):
    permission_classes = (AllowAny,)
    queryset = models.Signup.objects.all()
    serializer_class = serializers.SignupSerializer

views = {
    'signups': SignupViewSet
}
