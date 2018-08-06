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

class IntrospectiveViewSet(viewsets.ModelViewSet):
    @list_route(methods=['get'])
    def fields(self, request):
        fields = []
        for fieldName, field in self.get_serializer().fields.iteritems():
            fields.append({'label': field.label, 'key': fieldName})
        return Response({'fields': fields})

    def get_sorts(self):
        sortKeys = []
        if 'sort' in self.request.query_params:
            sortKeys = [self.request.query_params.get('sort')]
        return sortKeys

    def get_filter(self):
        filterArg = Q()

        for param, value in self.request.query_params.iteritems():
            if param == "sort":
                continue
            if param == "page":
                continue
            filterArg &= Q(**{param: value})

        return filterArg

    def get_queryset(self):
        results = super(IntrospectiveViewSet,
                self).get_queryset().filter(self.get_filter())

        for sortKey in self.get_sorts():
            results = results.order_by(sortKey)

        return results

class UserViewSet(IntrospectiveViewSet):
    queryset = User.objects.all()
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
    queryset = models.Person.objects.all()
    serializer_class = serializers.PersonSerializer
    permission_classes = (IsAuthenticated,)
    lookup_field = 'email'
    lookup_value_regex = '[^/]+'

class CityViewSet(IntrospectiveViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = address.models.Locality.objects.all()
    serializer_class = serializers.CitySerializer

    @list_route(methods=['get'])
    def search(self, request):
        results = address.models.Locality.objects.filter(name__icontains=request.GET.get('q')).order_by('name')
        page = self.paginate_queryset(results)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)


views = {
    'users': UserViewSet,
    'people': PersonViewSet,
    'cities': CityViewSet,
}
