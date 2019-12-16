from notify.models import Notification

class NewPerson(Notification):
    name = 'new-person'

class CaptainMade(Notification):
    name = 'captain-made'

class CaptainUnmade(Notification):
    name = 'captain-unmade'
