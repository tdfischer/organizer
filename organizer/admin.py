from django.contrib import admin
from django.utils import timezone
from django.urls import reverse
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
        return request.user.is_staff or person.is_captain or len(request.user.get_all_permissions()) > 0

    def each_context(self, request):
        lastWeek = timezone.now() + timedelta(days=-7)
        filters = FilterNode.objects.named()
        filterResults = []
        for f in filters:
            try:
                adminLink = reverse('organizer-admin:%s_%s_changelist'%(f.content_type.app_label,
                    f.content_type.model)) + "?named_filter=%s"%(f.pk,)
            except NoReverseMatch as e:
                try:
                    adminLink = reverse('admin:%s_%s_changelist'%(f.content_type.app_label,
                        f.content_type.model)) + "?named_filter=%s"%(f.pk,)
                except NoReverseMatch as e:
                    adminLink = None
            try:
                filterResults.append({
                    'count': f.results.count(),
                    'name': f.name,
                    'link': adminLink
                })
            except Exception as e:
                filterResults.append({
                    'count': e.message,
                    'name': f.name,
                    'link': adminLink
                })
        return {
            'recent_people': Person.objects.all().filter(created__gte=lastWeek).order_by('created'),
            'recent_onboardings': OnboardingStatus.objects.all().filter(created__gte=lastWeek).order_by('created'),
            'new_signups': Signup.objects.all().filter(approved=False),
            'filters': filterResults
        }

class OrganizerModelAdmin(admin.ModelAdmin):
    def has_permission(self, request):
        if request.user.is_anonymous:
            return False
        person, _ = Person.objects.get_or_create(email=request.user.email)
        return request.user.is_staff or person.is_captain

    def has_module_permission(self, request):
        return self.has_permission(request)

    def has_view_permission(self, request, obj=None):
        return self.has_permission(request)

    def has_add_permission(self, request):
        return self.has_permission(request)

    def has_change_permission(self, request, obj=None):
        return self.has_permission(request)

    def has_delete_permission(self, request, obj=None):
        return self.has_permission(request)

admin_site = OrganizerAdmin(name='organizer-admin')
