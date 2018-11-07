# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.db.models import Q, Count
from django.contrib.contenttypes.models import ContentType
from django.core import serializers
from django.utils import timezone
from mptt.models import TreeManager, MPTTModel, TreeForeignKey
from datetime import timedelta
from enumfields import Enum, EnumField
from django.core.cache import cache

class FilterManager(TreeManager):
    def named_for_model(self, model):
        return self.for_model(model).filter(name__isnull=False)

    def for_model(self, model):
        return self.get_queryset().filter(content_type=ContentType.objects.get_for_model(model))

    def named(self):
        return self.get_queryset().filter(name__isnull=False)

class AnnotationOperator(Enum):
    COUNT = 'count'

class Annotation(models.Model):
    prop_name = models.CharField(max_length=200)
    operator = EnumField(AnnotationOperator, max_length=200)
    field_name = models.CharField(max_length=200)
    filter = models.ForeignKey('FilterNode', null=True, blank=True)

    def as_dict(self):
        Operator = None
        if self.operator == AnnotationOperator.COUNT:
            Operator = Count

        if self.filter:
            params = {
                self.prop_name: Operator(self.field_name, distinct=True, filter=self.filter.as_filter())
            }
        else:
            params = {
                self.prop_name: Operator(self.field_name, distinct=True)
            }
        return params

    def __unicode__(self):
        return "%s = %s(%s, %s)"%(self.prop_name, self.operator,
                self.field_name, self.filter)

class FilterOperator(Enum):
    AND = 'and'
    OR = 'or'
    NOT = 'not'
    LESS_THAN_EQUAL = 'lte'
    LESS_THAN = 'lt'
    GREATER_THAN_EQUAL = 'gte'
    GREATER_THAN = 'gt'
    IS_TRUE = 'isTrue'
    IS_FALSE = 'isFalse'
    CONTAINS = 'contains'
    IS = 'is'
    IS_EMPTY = 'isNull'
    IS_NOT_EMPTY = 'isNotNull'

class FilterNode(MPTTModel):
    parent = TreeForeignKey('self', related_name='children', blank=True,
            null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    prop_name = models.CharField(max_length=200, null=True, blank=True)
    operator = EnumField(FilterOperator, max_length=200, null=True, blank=True)
    value = models.CharField(max_length=200, null=True, blank=True)
    annotations = models.ManyToManyField('Annotation',
            related_name='attachment', blank=True)

    content_type = models.ForeignKey(ContentType)

    objects = FilterManager()

    def __unicode__(self):
        if self.name:
            return self.name + ": " + self.as_string()
        return self.as_string()

    @property
    def results(self):
        results = cache.get('filters:%s'%(self.pk))
        cls = self.content_type.model_class()
        results = None
        if results is None:
            results = list(self.apply(cls.objects.all()).values_list('pk',
                flat=True))
            cache.set('filters:%s'%(self.pk), results, 300)
        return self.apply_annotations(cls.objects.filter(pk__in=results))

    def save(self, *args, **kwargs):
        if self.pk is not None:
            cache.delete('filters:%s'%(self.pk))
        return super(FilterNode, self).save(*args, **kwargs)

    def as_string(self):
        op = self.operator
        if op == FilterOperator.AND or op == FilterOperator.OR:
            joiner = ", %s "%(op)
            return "(%s)"%(joiner.join(c.as_string() for c in self.children.all()))
        elif op == FilterOperator.NOT:
            if self.children.exists():
                return "not %s"%(self.children.first().as_string())
            return "not (???)"
        elif op == FilterOperator.LESS_THAN_EQUAL:
            op = "<="
        elif op == FilterOperator.GREATER_THAN_EQUAL:
            op = ">="
        elif op == FilterOperator.GREATER_THAN:
            op = ">"
        elif op == FilterOperator.LESS_THAN:
            op = "<"
        return "%s %s %s"%(self.prop_name, op, self.value)

    def apply_annotations(self, queryset):
        annotations = {}
        for child in self.get_family():
            for annotation in child.annotations.all():
                annotations.update(annotation.as_dict())
        return queryset.annotate(
            **annotations
        )

    def apply(self, queryset):
        return self.apply_annotations(queryset).filter(self.as_filter())

    def as_filter(self):
        if self.operator == FilterOperator.AND:
            ret = Q()
            for c in self.get_children().all():
                ret = ret & c.as_filter()
            return ret
        if self.operator == FilterOperator.OR:
            ret = Q()
            for c in self.get_children().all():
                ret = ret | c.as_filter()
            return ret
        if self.operator == FilterOperator.NOT:
            return ~self.get_children().first().as_filter()
        if self.operator == FilterOperator.IS_TRUE:
            return Q(**{self.prop_name: True})
        if self.operator == FilterOperator.IS_FALSE:
            return Q(**{self.prop_name: True})
        if self.operator == FilterOperator.IS_EMPTY:
            return Q(**{self.prop_name + '__isnull': True})
        if self.operator == FilterOperator.IS_NOT_EMPTY:
            return Q(**{self.prop_name + '__isnull': False})
        value = self.value
        if value is None:
            value = ""
        if value.startswith("+") or value.startswith("-"):
            direction = value[0]
            unit = value[-1]
            quantity = int(direction + value[1:-1])
            diff = timedelta()

            if unit == "y":
                diff = timedelta(days=quantity * 365)
            elif unit == "d":
                diff = timedelta(days=quantity)
            elif unit == "h":
                diff = timedelta(hours=quantity)
            elif unit == "m":
                diff = timedelta(minutes=quantity)

            value = timezone.now() + diff
        if self.operator == FilterOperator.IS:
            params = {self.prop_name: value}
        else:
            params = {"%s__%s"%(self.prop_name, self.operator.value): value}
        return Q(**params)
