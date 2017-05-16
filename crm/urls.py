from django.conf.urls import url, include
from . import views

urlpatterns = [
    url(r'^action/(?P<action_slug>.+)-(?P<action_id>[0-9]+)/?', views.view_action),
    url(r'^action/(?P<action_id>[0-9]+)/?', views.view_action),
    url(r'^service-worker.js', views.service_worker),
    url(r'^', views.index),
]
