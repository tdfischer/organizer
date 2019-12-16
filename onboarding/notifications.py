from notify.models import Notification

class SignupApproved(Notification):
    name = 'signup-approved'

class NewEventSignup(Notification):
    name = 'new-event-signup'

class NewSignup(Notification):
    name = 'new-signup'

class OnboardingFailure(Notification):
    name = 'onboarding-failure'

class OnboardingSuccess(Notification):
    name = 'onboarding-success'

class UnapprovedSignupsWaiting(Notification):
    name = 'unapproved-signups-waiting'
