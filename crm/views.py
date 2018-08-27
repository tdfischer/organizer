# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
from . import models, serializers
from django.views.decorators.clickjacking import xframe_options_exempt
from django.http import HttpResponse
import json

def index(request, *args, **kwargs):
    return render(request, 'webpack-index.html')

def service_worker(request, *args, **kwargs):
    return render(request, 'service-worker.js', content_type='text/javascript')

def robots(request, *args, **kwargs):
    return render(request, 'robots.txt')
