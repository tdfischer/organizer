import requests
from django.conf import settings
from mailchimp3 import MailChimp
from mailchimp3.mailchimpclient import MailChimpError
from slackclient import SlackClient
import logging

log = logging.getLogger(__name__)

class Component(object):
    def handle(self, configuration, person):
        raise NotImplementedError

class SlackInvite(Component):
    def handle(self, configuration, person):
        SLACK_INVITE_URL = 'https://slack.com/api/users.admin.invite'
        response = requests.post(
            SLACK_INVITE_URL,
            data = dict(
                email = person.email,
                token = settings.SLACK_API_TOKEN
            )
        )
        if response.status_code == 200:
            log.debug("Inviting %s to slack: %s", person, response.json())
            data = response.json()
            if not data['ok'] and data['error'] == "already_in_team":
                return (True, "Already invited to slack")
            return (data['ok'], response.json())
        else:
            log.debug("Inviting %s to slack: %s", person, response)
            return (False, str(response.json()))

class DiscourseInvite(Component):
    def handle(self, configuration, person):
        DISCOURSE_INVITE_URL = settings.DISCOURSE_BASE_URL + "/invites"
        response = requests.post(
            DISCOURSE_INVITE_URL,
            data = dict(
                api_key = settings.DISCOURSE_API_KEY,
                email = person.email,
                api_username = 'system'
            )
        )
        log.debug("Inviting %s to discourse: %s", person, response)
        if response.status_code == 200:
            return (True, "Invited")
        if response.status_code == 422:
            return (True, "Already invited")
        return (False, str(response.json()))

class MailchimpAutomation(Component):
    def handle(self, config, person):
        mailchimp = MailChimp(mc_api=settings.MAILCHIMP_SECRET_KEY)
        try:
            mailchimp.lists.members.create(
                settings.MAILCHIMP_LIST_ID,
                {'email_address': person.email, 'status': 'subscribed'}
            )
        except MailChimpError, e:
            pass
        try:
            mailchimp.automations.emails.queues.create(
                config['automation_id'],
                config['automation_email_id'],
                {'email_address': person.email}
            )
            log.debug("Added %s to mailchimp automation", person)
            return (True, "Added to automation.")
        except MailChimpError, e:
            if 'already sent this email' in e.args[0]['detail']:
                log.debug("Already added %s to mailchimp automation", person)
                return (True, "Already added to automation.")
            else:
                raise e

class SlackNotification(Component):
    def handle(self, config, person):
        slack = SlackClient(settings.SLACK_API_TOKEN)
        response = slack.api_call(
            "chat.postMessage",
            channel=config['channel'],
            text=":tada: New member onboarded: {0} <{1}>".format(person.name,
                person.email),
        )
        log.debug("Notified slack about new member %s: %s", person, response)
        return (response['ok'], repr(response))

class Noop(Component):
    def handle(self, config, person):
        return (True, "Nothing happened.")
