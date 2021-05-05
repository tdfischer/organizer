from importlib import import_module
from django.conf import settings

exporterCache = None

def get_exporter_class(name):
    global exporterCache
    if exporterCache is None:
        exporterCache = collect_importers()
    return exporterCache.get(name)

def collect_exporters():
    ret = {}
    for app in settings.INSTALLED_APPS:
        try:
            imported = import_module('.'.join((app, 'exporting')))
        except ImportError as e:
            continue
        if hasattr(imported, 'exporters'):
            ret.update(imported.exporters)
    return ret

class DatasetExporter(object):
    def export_page(self, page, dry_run=False):
        raise NotImplementedError()

    def init(self):
        pass

    def __iter__(self):
        self.init()
        self.__offset = 0
        return self

    def get_queryset(self):
        return self.Meta.resource().get_queryset()

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
