from django.conf import settings
from slackclient import SlackClient
import logging

log = logging.getLogger(__name__)

class Channel(object):
    def send(self, noun, verb, target):
        raise NotImplementedError()

class Slack(Channel):
    def send(self, config, noun, verb, target=None):
        if target is None:
            message = ' '.join((noun, verb))
        else:
            message = ' '.join((noun, verb, target))
        slack = SlackClient(settings.SLACK_API_TOKEN)
        response = slack.api_call(
            "chat.postMessage",
            channel=config['channel'],
            text=message
        )
        log.debug("Notified slack channel %s: %s", config['channel'], message)
