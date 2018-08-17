from models import Person

def ensure_person_for_email(user, details, *args, **kwargs):
    person, _ = Person.objects.update_or_create(
        email=user.email,
        defaults=dict(
            name = details.get('name')
        )
    )
    return {'person': person}
