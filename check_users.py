#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from accounts.models import CustomUser

users = CustomUser.objects.all()
print(f'Total users: {users.count()}')
for u in users:
    groups = list(u.groups.values_list('name', flat=True))
    print(f'  {u.email} - is_staff: {u.is_staff} - groups: {groups}')
