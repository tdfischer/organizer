from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.request import clone_request
from rest_framework.decorators import list_route, detail_route
import logging
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.template import loader, engines
from django.db.models import Q, Count, Subquery, OuterRef
from django.contrib.auth import logout
from django.conf import settings
from django.http import Http404
import django_rq
from . import models, serializers
import address
from airtable import Airtable
import requests
from organizer.viewsets import IntrospectiveViewSet

class UserViewSet(IntrospectiveViewSet):
    queryset = User.objects.order_by('id')
    serializer_class = serializers.UserSerializer
    permission_classes = (IsAuthenticated,)

    @list_route(methods=['get'])
    def logout(self, request):
        logout(request)
        return Response()

    def get_object(self):
        pk = self.kwargs.get('pk')

        if pk == 'me':
            return self.request.user

        return super(UserViewSet, self).get_object()

class AllowPUTAsCreateMixin(object):
    """
    The following mixin class may be used in order to support PUT-as-create
    behavior for incoming requests.
    """
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object_or_none()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if instance is None:
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            lookup_value = self.kwargs[lookup_url_kwarg]
            extra_kwargs = {self.lookup_field: lookup_value}
            serializer.save(**extra_kwargs)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def get_object_or_none(self):
        try:
            return self.get_object()
        except Http404:
            if self.request.method == 'PUT':
                # For PUT-as-create operation, we need to ensure that we have
                # relevant permissions, as if this was a POST request.  This
                # will either raise a PermissionDenied exception, or simply
                # return None.
                self.check_permissions(clone_request(self.request, 'POST'))
            else:
                # PATCH requests where the object does not exist should still
                # return a 404 response.
                raise

class PersonViewSet(AllowPUTAsCreateMixin, IntrospectiveViewSet):
    queryset = models.Person.objects.all().order_by('email')
    serializer_class = serializers.PersonSerializer
    permission_classes = (IsAuthenticated,)
    lookup_field = 'email'
    lookup_value_regex = '[^/]+'

class TurfViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = models.Turf.objects.all()
    serializer_class = serializers.TurfSerializer

class PersonStateViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = models.PersonState.objects.all()
    serializer_class = serializers.PersonStateSerializer

class CityViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = address.models.Locality.objects.all()
    serializer_class = serializers.LocalitySerializer

views = {
    'users': UserViewSet,
    'turfs': TurfViewSet,
    'people': PersonViewSet,
    'states': PersonStateViewSet,
    'cities': CityViewSet
}
