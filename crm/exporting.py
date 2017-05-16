class Exporter(object):
    pass

class AirtableExporter(Exporter):
    def __init__(self, *args):
        super(AirtableExporter, self).__init__(*args)
        self.airtable = Airtable(
                settings.AIRTABLE_BASE_ID,
                'Members and Volunteers',
                api_key=settings.AIRTABLE_API_KEY)
        self.members = self.airtable.get_all(view='Everyone')

    def import_row(self, row):
        rowEmail = row['email'].strip().lower()
        rowName = row['fullname'].strip().lower()
        for m in self.members:
            memberEmail = m['fields'].get('Email', '').strip().lower()
            memberName = m['fields'].get('Name', '').strip().lower()
            if memberEmail == rowEmail or memberName == rowName:
                return memberEmail, False
        print 'creating new row for', row['email'], row['fullname']
        self.airtable.insert({
            'Name': row['fullname'],
            'Email': row['email'],
            'Membership Basis': 'Volunteer'
        })
        return row['email'], True

