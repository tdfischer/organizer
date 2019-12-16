from django.conf import settings
from slackclient import SlackClient
import logging
from organizer import plugins
from django import forms

log = logging.getLogger(__name__)

class Channel(plugins.ConfigurablePlugin):
    __metaclass__ = plugins.PluginMount
    app_module_name = 'channels'

    def __init__(self, config):
        self.config = config

    def send(self, noun, verb, target, detail):
        raise NotImplementedError()

class SlackConfigForm(forms.Form):
    channel_id = forms.ChoiceField(required=True)

    def __init__(self, *args, **kwargs):
        super(SlackConfigForm, self).__init__(*args, **kwargs)
        slack = SlackClient(settings.SLACK_API_TOKEN)
        response = slack.api_call('channels.list', exclude_archived=True,
                exclude_members=True)
        choices = []
        for l in response['channels']:
            choices.append((l['id'], l['name']))
        self.fields['channel_id'].choices = choices

class Slack(Channel):
    name = 'slack'
    options_form_class = SlackConfigForm

    def send(self, noun, verb, target=None, detail=None):
        if target is None:
            message = ' '.join((str(noun), str(verb)))
        else:
            message = ' '.join((str(noun), str(verb), str(target)))
        slack = SlackClient(settings.SLACK_API_TOKEN)
        response = slack.api_call(
            "chat.postMessage",
            channel=self.config['channel_id'],
            text=message
        )
        log.debug("Notified slack channel %s: %s", self.config['channel_id'], message)
