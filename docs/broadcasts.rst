.. _broadcasts:

Broadcasts
==========

Organizer has a limited neighborhood broadcast tool which sends e-mails to all
members within a specific neighborhood or turf. It is available to neighborhood
captains, which are defined through the Django administration UI (See
:ref:`maintenance`).


.. _new-neighbor-notifications:

New Neighbor Notifications
--------------------------

In addition to neighborhood-wide message broadcasts, Organizer can be configured
to e-mail your neighborhood captains (or really, any specific e-mail address)
with a list of new people for each neighborhood in the :ref:`CRM` at regular
intervals.

It is intended to be ran on a regular schedule, such as once a week or every
afternoon. To run it:

./manage.py new_neighbors

The notifications may be configured through the :ref:`administration-interface`.
