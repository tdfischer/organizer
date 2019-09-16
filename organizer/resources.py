from import_export import fields, widgets

class CommaSeparatedListWidget(widgets.ManyToManyWidget):
    def __init__(self, *args, **kwargs):
        super(CommaSeparatedListWidget, self).__init__(*args, model=None, **kwargs)

    def clean(self, value, row=None, *args, **kwargs):
        try:
            i = iter(value)
        except TypeError:
            return value.split(',')
        return i

    def render(self, obj = None, *args, **kwargs):
        try:
            i = iter(obj)
        except TypeError:
            return ''
        return ','.join(i)

class TagSetField(fields.Field):
    def __init__(self, append=True, remove=False, replace=False, *args,
            **kwargs):
        super(TagSetField, self).__init__(*args, **kwargs)
        self.append = append
        self.remove = remove
        self.replace = replace

    def export(self, obj):
        value = self.get_value(obj)
        if value is None:
            return ''
        return self.widget.render(value.names(), obj)

    def save(self, obj, data, is_m2m=False):
        if not self.readonly and is_m2m:
            attrs = self.attribute.split('__')
            for attr in attrs[:-1]:
                obj = getattr(obj, attr, None)
            cleaned = self.clean(data)
            if cleaned is not None or self.saves_null_values:
                if self.append:
                    getattr(obj, attrs[-1]).add(*cleaned)
                elif self.remove:
                    getattr(obj, attrs[-1]).remove(*cleaned)
                elif self.replace:
                    getattr(obj, attrs[-1]).set(*cleaned)
