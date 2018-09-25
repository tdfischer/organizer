from hypothesis import settings, Verbosity
import os

settings.register_profile("ci", max_examples=300)
settings.register_profile("dev", max_examples=10)
settings.register_profile("debug", max_examples=10, verbosity=Verbosity.verbose)
settings.load_profile(os.getenv('HYPOTHESIS_PROFILE', 'default'))
