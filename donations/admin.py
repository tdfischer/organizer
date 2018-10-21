# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from . import models

from organizer.admin import admin_site

admin.site.register(models.Donation)
admin_site.register(models.Donation)
