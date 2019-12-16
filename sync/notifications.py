from notify.models import Notification

class ImportFailure(Notification):
    name = 'import-failure'

class ExportFailure(Notification):
    name = 'export-failure'
