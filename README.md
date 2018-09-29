# Organizer

[![CircleCI](https://circleci.com/gh/tdfischer/organizer.svg?style=svg)](https://circleci.com/gh/tdfischer/organizer)
[![Maintainability](https://api.codeclimate.com/v1/badges/86f7c614494ac53194e2/maintainability)](https://codeclimate.com/github/tdfischer/organizer/maintainability)
[![codecov](https://codecov.io/gh/tdfischer/organizer/branch/master/graph/badge.svg)](https://codecov.io/gh/tdfischer/organizer)


I don't think I have any unique perspectives on organizing people. It is hard
work and the tools out there are never the best. Organizer is the particular
windmill I have decided to tilt at in response.

It is a work in progress. Small bits of hacking thrown around a django core and
postgres database. Expect bumps. Expect bugs. Expect my undying admiration and
love for your patch submissions and pull requests.

## Features

* Build a list of activists, tag them
* Send an e-mail notification for each neighborhood when new people are added
  based on street address.

Future ideas proprosed:

* Create actions, drive signups, collect data through forms
* Track action history: Who signed up, did they show up, how reliable are they?
* Email segments of activists in bulk.
* Import CSV files of activists
* Quick organizer overview of every action's data
* Mobile UI polish
* .onion support
* iCal/caldav subscription of events
* Sync segments with Mailchimp for each action
* Sync activists between Salesforce and Mailchimp
* Email discussion
* Slack integration
* Reports

## Installation

Organizer is best deployed as a Heroku app.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Once your app is up and running, use ```herkou config:set VAR=VALUE ...``` to
configure the following settings.

### Required settings

There is only one required setting that must be set for the app to run at all.

* SECRET_KEY - A random key to securely verify cookies.

### Sentry

* SENTRY_DSN - If you use sentry.io, enter your DSN here to receive error logs.

### Redis

* REDISTOGO_URL - Heroku often sets this one automatically. The default is
  redis://localhost:6379/0

### Email

E-mails are sent using Mailgun. Support for other platforms can be added in the
future; organizer uses Anymail, a django library with support for a broad list
of mail services.

* MAILGUN_API_KEY - Your API key from Mailgun.
* MAILGUN_DOMAIN - Your mailgun domain 
* ANYMAIL_WEBHOOK_AUTHORIZATION - Magic token you set in Mailgun
* DEFAULT_FROM_EMAIL - Who your emails will be coming from when sent through
  mailgun.

### Airtable

Organizer supports importing and updating data through Airtable.

* AIRTABLE_API_KEY
* AIRTABLE_BASE_ID
* AIRTABLE_TABLE_NAME

### Discourse

Login through an installation of Discourse with SSO authentication enabled

* DISCOURSE_BASE_URL
* DISCOURSE_SSO_SECRET

### Slack

Enables logging in through Slack, optionally restricting it to a single team.

* SLACK_KEY
* SLACK_SECRET
* SLACK_TEAM_ID - Leave this unset to allow any team to access. It is an error
  to not set this if slack API credentials are provided.


## Management commands and batch processing

### ``new_neighbors``

This will send out email notifications for any new people that have been added
to a neighborhood based on their street address. This should be run fairly
regularly, but at most once per day.


### ``import [importer]...``

A bit of a swiss army knife of importing data. Four importers are provided,
``mailchimp-people``, ``airtable-people``, ``airtable-attendance``, and
``google-calendar-events``. Expect more importers to be added in the future. If you have an
idea for one, open a Github issue or submit a pull request.

### ``make_superuser``

Use this command after you've logged in for the first time to make a given
e-mail address superuser. Superusers are able to access the administration
interface at ``/admin/``.

### ``fake_data``

Generates some fake data for you to play around with during development.
Requires that the ``DEBUG`` environment variable not be set, i.e. running in a
production environment.

## Importing and Exporting

Organizer does not exist in a vaccuum, and neither does your data, although it
is probably spread across multiple silos. Thats fine! Organizer has an easy to
use import/export framework, which was designed with an eye towards easily
adding in other sources.

Four importers are included:


### ``google-calendar-events``

Imports events from a Google Calendar. Requires the following configuration
settings:

* ``GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`` - A large JSON blob containing Google
  API credentials for an application 'service account'. Can be downloaded after
  jumping through many hoops on https://console.developers.google.com. Yes, the
  entire JSON blob goes into this environment variable.
* ``GOOGLE_CALENDAR_IMPORT_ID`` - The ID of your calendar to import. You can
  find this in the Google Calendar web interface.

### ``airtable-attendance``

Imports event attendance records from Airtable. Currently inflexible and highly
specific to East Bay for Everyone; a pull request to allow configuration is much
appreciated. Uses the following configuration:

* ``AIRTABLE_BASE_ID``
* ``AIRTABLE_API_KEY``
* ``AIRTABLE_TABLE_NAME`` - A table that stores a map of record IDs to e-mail
  addresses. There is currently no mechanism for configuring the table of
  events, which is 'Events'.

### ``airtable-people```

Imports people records from Airtable. Also highly EBFE specific, but can be
easily modified for other setups. Uses the following configuration:

* ``AIRTABLE_BASE_ID``
* ``AIRTABLE_API_KEY``
* ``AIRTABLE_TABLE_NAME`` - Table from which you will import people

### ``mailchimp-people```

Imports people from Mailchimp. Only uses e-mail address, and the FNAME/LNAME
fields that come with a default setup. Uses the following configuration:

* ``MAILCHIMP_SECRET_KEY``
* ``MAILCHIMP_LIST_ID``

## Development

Organizer is split into two parts. The backend is written for Python 2.x, using
Django. The frontend is written for node 9.x using React, Redux, webpack, and
friends; webpack-dev-server runs in development mode, and compiles to static
files in production.

Running Organizer locally is similar to most django and npm projects. Organizer
suggests using ``pipenv`` to manage your virtualenv and dependencies.

Install python dependencies:

    $ pipenv install

Install nodejs dependencies:

    $ npm install

Initialize the database:

    $ ./manage.py migrate

Run the backend server, frontend server, and redis-server all at once:

    $ pipenv run npm start

This performs the following:

* Starts ``redis-server``
* Runs ``webpack-dev-server`` on port 8080. You should never have to point your
  browser at this directly.
* Runs ``./manage.py runserver``, the django development server, on port 8000.
  This is where you send your browser.

After starting the application, send your browser to the django server on
http://localhost:8000/

Provided that you set both the ``DEBUG`` and
``USE_REALLY_INSECURE_DEVELOPMENT_AUTHENTICATION_BACKEND`` environment
variables, organizer has an incredibly insecure authentication backend for
development. It is an error to use LocalDevAuth without these variables set.

## Contributions

Pull requests welcome. All contributions retain their copyright, but must be
licensed under the Affero General Public License v3.
