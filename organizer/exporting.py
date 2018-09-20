from importlib import import_module

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
        except ImportError, e:
            continue
        if hasattr(imported, 'exporters'):
            ret.update(imported.exporters)
    return ret

class DatasetExporter(object):
    def export_page(self, page):
        raise NotImplementedError()

    def init(self):
        pass
