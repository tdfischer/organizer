from django.conf import settings
from slackclient import SlackClient
import logging
from organizer import plugins

log = logging.getLogger(__name__)

class Channel(plugins.ConfigurablePlugin):
    __metaclass__ = plugins.PluginMount
    app_module_name = 'channels'

    def __init__(self, config):
        self.config = config

    def send(self, noun, verb, target):
        raise NotImplementedError()

class Slack(Channel):
    name = 'slack'

    def send(self, noun, verb, target=None):
        if target is None:
            message = ' '.join((str(noun), str(verb)))
        else:
            message = ' '.join((str(noun), str(verb), str(target)))
        slack = SlackClient(settings.SLACK_API_TOKEN)
        response = slack.api_call(
            "chat.postMessage",
            channel=self.config['channel'],
            text=message
        )
        print response
        log.debug("Notified slack channel %s: %s", self.config['channel'], message)
