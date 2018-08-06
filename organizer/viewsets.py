from rest_framework import viewsets, status
from rest_framework.decorators import list_route, detail_route
from django.db.models import Q

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
            if param.endswith("__in"):
                filterArg &= Q(**{param: [value]})
            else:
                filterArg &= Q(**{param: value})

        return filterArg

    def get_queryset(self):
        results = super(IntrospectiveViewSet,
                self).get_queryset().filter(self.get_filter())

        for sortKey in self.get_sorts():
            results = results.order_by(sortKey)

        return results


