# Organizer

I don't think I have any unique perspectives on organizing people. It is hard
work and the tools out there are never the best. Organizer is the particular
windmill I have decided to tilt at in response.

It is a work in progress. Small bits of hacking thrown around a django core and
postgres database. Expect bumps. Expect bugs. Expect my undying admiration and
love for your patch submissions and pull requests.

## Features

* Build a list of activists, tag them

Features planned:

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

Organizer is primarily deployed as a Heroku app.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Once deployed, use ```herkou config:set VAR=VALUE ...``` to set:

* MAILGUN_API_KEY - Your API key from Mailgun.
* GOOGLE_MAPS_API_KEY - Your Google Maps API key, for geocoding.
* SECRET_KEY - A random key for django security magic
* DEFAULT_FROM_EMAIL - Who your emails will be coming from when sent through
  mailgun.

## Development

Running Organizer locally is similar to most django projects.

Initialize the database:

  $ ./manage.py migrate

Run the server:

  $ ./manage.py runserver

Run with gunicorn (or another wsgi server):
  
  $ gunicorn organizer.wsgi

## Contributions

Pull requests welcome. All contributions retain their copyright, but must be
licensed under the Affero General Public License v3.
