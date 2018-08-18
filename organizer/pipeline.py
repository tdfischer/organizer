from django.contrib.auth.models import User, Group

def sync_from_discourse_auth(user, details, **kwargs):
    groups = []
    for groupSlug in details.get('groups', ''):
        groupObj, _ = Group.objects.get_or_create(name=groupSlug)
        groups.append(groupObj)

    user.is_superuser = details.get('is_superuser', False)
    user.is_staff = details.get('is_staff', False)
    user.groups = groups
    user.save()
