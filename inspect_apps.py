import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from django.apps import apps

print("Installed Apps and their labels:")
for app_config in apps.get_app_configs():
    print(f" - {app_config.name} (label: {app_config.label})")

print("\ntesting app 'logistque':")
try:
    log_app = apps.get_app_config('logistque')
    print(f"Success! label: {log_app.label}")
except Exception as e:
    print(f"Error getting app config for 'logistque': {e}")
