.. _maintenance:

Maintenance
===========

Organizer does keep to itself for the most part. A vanilla installation requires
almost no touching after the initial configuration and setup.

In addition to the import and export commands, there are a handful of useful
commands you can run:

* make_superuser - Makes a given email address a superuser.
* dedupe - Allows you to dedupe your airtable. It is an interactive script that
  will prompt you to merge items before asking again to save changes.
* list_members - Probably only useful for East Bay for Everyone. Lists everyone
  who has attended at least one event and thus a member. Tags people who have
  attended at least three events as a voting member.


.. _administrators:

Administrators
--------------

Administrators are users with administration privileges. This may be granted
automatically through the login process; See :ref:`integrations`.

.. _administration-interface:

Administration Interface
~~~~~~~~~~~~~~~~~~~~~~~~

Organizer is built on top of Django, which includes a delightful administration
backend. You may access it via /superuser/; /admin/ is the reduced CRM-specific
version accessable from the normal UI.
