import pkgutil
import importlib
from django.apps import apps
from django import forms

class PluginMount(type):
    def __init__(cls, name, bases, attrs):
        if not hasattr(cls, 'plugins'):
            cls.plugins = {}
        else:
            cls.plugins[cls.name] = cls

    def import_plugins(cls):
        for app in apps.get_app_configs():
            module_name = '.'.join((app.name, cls.app_module_name))
            if pkgutil.find_loader(module_name) is None:
                continue
            importlib.import_module(module_name)

    def get_plugin(cls, name):
        cls.import_plugins()
        return cls.plugins[name]

class ConfigurablePlugin(object):
    options_form_class = forms.Form
    def options_form(self, *args, **kwargs):
        return self.options_form_class(*args, **kwargs)
