from django.contrib.auth.models import User, Group

def sync_from_discourse_auth(user, details, **kwargs):
    for groupSlug in details.get('groups', []):
        groupSlug = 'discourse:' + groupSlug
        groupObj, _ = Group.objects.get_or_create(name=groupSlug)
        user.groups.add(groupObj)

    for group in user.groups.filter(name__startswith='discourse:'):
        _, groupName = group.name.split(':')
        if groupName not in details.get('groups', []):
            user.groups.remove(group)

    user.is_superuser = details.get('is_superuser', False)
    user.is_staff = details.get('is_staff', False)
    user.save()

def sync_backend_group(user, backend, **kwargs):
    groupName = "social-auth:%s"%(backend.name)
    backend_group, _ = Group.objects.get_or_create(name=groupName)
    user.groups.add(backend_group)
