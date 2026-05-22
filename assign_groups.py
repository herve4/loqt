#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from accounts.models import CustomUser
from django.contrib.auth.models import Group

# Get or create groups
admin_group = Group.objects.get_or_create(name='Admin')[0]
logistician_group = Group.objects.get_or_create(name='Responsable Logistique')[0]
member_group = Group.objects.get_or_create(name='Membre')[0]

# Assign staff users to Admin group
# Assign non-staff users to Member group
for user in CustomUser.objects.all():
    user.groups.clear()
    if user.is_staff:
        user.groups.add(admin_group)
        print(f'✓ {user.email} → Admin group')
    else:
        user.groups.add(member_group)
        print(f'✓ {user.email} → Member group')

print('\n✅ Groups assigned successfully!')
