from organizer import plugins
from . import models

class Notification(object):
    __metaclass__ = plugins.PluginMount
    app_module_name = 'notifications'

    def send(self, noun, verb, target=None):
        channels = models.NotificationChannel.objects.find(sources__name=self.name)
        for channel in channels:
            channel.send(noun, verb, target)

