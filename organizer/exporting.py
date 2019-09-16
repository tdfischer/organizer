from importlib import import_module
from django.conf import settings
from . import plugins

class DatasetExporter(plugins.ConfigurablePlugin):
    __metaclass__ = plugins.PluginMount
    app_module_name = 'exporting'

    def export_page(self, page, dry_run=False):
        raise NotImplementedError()

    def __init__(self, queryset, configuration={}):
        self.configuration = configuration
        self.queryset = queryset

    def __iter__(self):
        self.init()
        self.__offset = 0
        return self

    def get_queryset(self):
        return self.queryset

    def next(self):
        if self.__offset >= len(self):
            raise StopIteration
        batchSize = getattr(self.Meta, 'page_size', 100)
        ret = self.get_queryset()[self.__offset:(self.__offset+batchSize)]
        self.__offset += batchSize
        return self.Meta.resource().export(ret)

    def __len__(self):
        return self.get_queryset().count()

    def __getitem__(self, key):
        return self.get_queryset()[key]
