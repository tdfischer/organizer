Installation
============

Organizer is best deployed as a Heroku app.

Once your app is up and running, use ```herkou config:set VAR=VALUE ...``` to
configure the following settings.

Required settings
-----------------

There is only one required setting that must be set for the app to run at all.

* SECRET_KEY - A random key to securely verify cookies.

Email
~~~~~

E-mails are sent using Mailgun. Support for other platforms can be added in the
future; organizer uses Anymail, a django library with support for a broad list
of mail services. Pull requests are welcome.

* MAILGUN_API_KEY - Your API key from Mailgun.
* MAILGUN_DOMAIN - Your mailgun domain 
* ANYMAIL_WEBHOOK_AUTHORIZATION - Magic token you set in Mailgun
* DEFAULT_FROM_EMAIL - Who your emails will be coming from when sent through
  mailgun.


Optional settings
-----------------

These settings are not required in most circumstances, but exist nonetheless.

* DEFAULT_PERSON_STATE - Set the 'default' state to be used when creating a
  person and none is specified.
* REDISTOGO_URL - Heroku often sets this one automatically. The default is
  redis://localhost:6379/0

Settings you should never use unless you know what you're doing
---------------------------------------------------------------

Misuse of these settings come with terrible consequences.

* DEBUG - Sets debug mode. Breaks all privacy guarantees and exposes all sorts
  of personally identifying information. May a million locusts fly from your
  eyes, etc. Useful for local development.
* USE_REALLY_INSECURE_DEVELOPMENT_AUTHENTICATION_BACKEND - Does what it says on
  the tin. Organizer comes with a special local development backend for testing
  and development purposes. Only works in conjunction with setting DEBUG.
  Turning this on removes all layers of privacy and security, exposing the
  entire database to the public eye. Many people will hate you for a long time.
  May your children and your children's children etc be cursed with boils and
  so on. Also useful for local development.
