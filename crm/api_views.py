from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.decorators import list_route, detail_route
import logging
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.template import loader, engines
from django.db.models import Q, Count, Subquery, OuterRef
from django.contrib.auth import logout
from django.conf import settings
import django_rq
from . import models, serializers
import address
from airtable import Airtable
import requests

class MemberViewSet(viewsets.ViewSet):
    permission_classes = (IsAuthenticated,)
    base_name = 'member'
    lookup_value_regex = '[a-zA-Z0-9@-_\+.]+'
    def list(self, request, format=None):
        airtable = Airtable(settings.AIRTABLE_BASE_ID, 'Members and Volunteers', api_key=settings.AIRTABLE_API_KEY)
        members = airtable.get_all(view='Everyone')
        return Response({'results': members})

    @detail_route(methods=['get'])
    def topics(self, request, pk=None):
        params = {
            'api_key': '3855d634b19ea24775b13f8697885c4688863ff5d7950a1395244a15635f1a05',
            'api_username': 'system',
        }

        users = requests.get(
            'https://discuss.eastbayforeveryone.org/admin/users/list/all.json?email={0}'.format(pk),
            params=params
        ).json()

        username = ''
        try:
            username = users[0]['username']
        except:
            return Response({'results': []})

        topics = requests.get(
            'https://discuss.eastbayforeveryone.org/topics/created-by/{0}.json'.format(username),
            params=params
        ).json()
        return Response({'results': topics})

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

class PersonViewSet(IntrospectiveViewSet):
    queryset = models.Person.objects.all()
    serializer_class = serializers.PersonSerializer
    permission_classes = (IsAuthenticated,)

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
    'members': MemberViewSet
}
