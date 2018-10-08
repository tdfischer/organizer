.. _integrations:

Integrations
============

Organizer can be connected to many other services.

Sentry
------

Organizer supports reporting crashes, errors, and in-app problem reports to
Sentry.io. It is recommended that you connect it (its "free"!). When enabled,
users gain a menu item which allows them to report problems to you.

* SENTRY_DSN - If you use sentry.io, enter your DSN here to receive error logs.

MailChimp
---------

People can be imported from and exported to MailChimp.

* MAILCHIMP_SECRET_KEY - Your secret API key
* MAILCHIMP_LIST_ID - The list you will be synchronizing with. Future releases
  will support more lists without environment configuration.

./manage.py import mailchimp-people

./manage.py export mailchimp-people

Google Maps
-----------

Organizer uses Google Maps for normalizing and geolocating street addresses.

* GOOGLE_MAPS_KEY

Google Calendar
---------------

Events can be imported from a Google Calendar calendar

* GOOGLE_SERVICE_ACCOUNT_CREDENTIALS - A big JSON blob. Sorry.
* GOOGLE_CALENDAR_IMPORT_ID - ID of the calendar you'll be importing from.

./manage.py import google-calendar-events

Airtable
--------

Organizer supports importing and exporting people through Airtable.

* AIRTABLE_API_KEY
* AIRTABLE_BASE_ID
* AIRTABLE_TABLE_NAME

./manage.py import airtable-people
./manage.py export airtable-people
./manage.py export airtable-attendance

Discourse
---------

Login through an installation of Discourse with SSO authentication enabled

* DISCOURSE_BASE_URL - Full url to the index, eg https://discuss.example.com/
* DISCOURSE_SSO_SECRET - Secret you configure in discourse's settings.

If a user is staff or an admin on discourse, they will be one in Organizer as
well. Users will also be placed in the same groups, though groups are currently
unused.

Slack
-----

Enables logging in through Slack, optionally restricting it to a single team.

* SLACK_KEY
* SLACK_SECRET
* SLACK_TEAM_ID - Leave this unset to allow any team to access. It is an error
  to not set this if slack API credentials are provided.
