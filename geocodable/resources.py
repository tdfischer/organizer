from import_export import widgets
from . import models

class LocationAliasWidget(widgets.Widget):
    def clean(self, value, row, *args, **kwargs):
        if value is None:
            return None
        return models.LocationAlias.objects.fromRaw(value)

    def render(self, value, obj=None):
        if value is None:
            return None
        return value.raw

