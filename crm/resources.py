from import_export import resources, fields, widgets
from geocodable.resources import LocationAliasWidget
from organizer.resources import TagSetField, CommaSeparatedListWidget
from . import models

class PersonResource(resources.ModelResource):
    location = fields.Field(
        column_name = 'location',
        attribute = 'location',
        widget=LocationAliasWidget(),
        saves_null_values = False
    )

    tags = TagSetField(
        column_name = 'tags',
        attribute = 'tags',
        widget=CommaSeparatedListWidget(),
        saves_null_values=False
    )

    def skip_row(self, instance, previous):
        if instance.email is None:
            return True
        return super(PersonResource, self).skip_row(instance, previous)

    class Meta:
        model = models.Person
        import_id_fields = ('email',)
        fields = ('email', 'name', 'location', 'tags')
        report_skipped = True
        skip_unchanged = True
