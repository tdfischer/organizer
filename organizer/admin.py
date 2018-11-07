from django.contrib import admin
from django.core.urlresolvers import reverse
from django.utils import timezone
from django.urls.resolvers import NoReverseMatch
from crm.models import Person
from filtering.models import FilterNode
from onboarding.models import OnboardingStatus, Signup
from datetime import timedelta

class OrganizerAdmin(admin.AdminSite):
    site_header = 'Organizer Administration'
    index_title = 'Dashboard'
    index_template = 'admin-index.html'

    def has_permission(self, request):
        if request.user.is_anonymous:
            return False
        person, _ = Person.objects.get_or_create(email=request.user.email)
        return person.is_captain

    def each_context(self, request):
        lastWeek = timezone.now() + timedelta(days=-7)
        filters = FilterNode.objects.named()
        filterResults = []
        for f in filters:
            try:
                adminLink = reverse('organizer-admin:%s_%s_changelist'%(f.content_type.app_label,
                    f.content_type.model)) + "?named_filter=%s"%(f.pk,)
            except NoReverseMatch:
                continue
            filterResults.append({
                'count': f.results.count(),
                'name': f.name,
                'link': adminLink
            })
        return {
            'recent_people': Person.objects.all().filter(created__gte=lastWeek).order_by('created'),
            'recent_onboardings': OnboardingStatus.objects.all().filter(created__gte=lastWeek).order_by('created'),
            'new_signups': Signup.objects.all().filter(approved=False),
            'filters': filterResults
        }

admin_site = OrganizerAdmin(name='organizer-admin')

