#!/usr/bin/env python
import os
import sys
import django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from logistque.models import Region, Ville, Eglise

count_r = Region.objects.count()
count_v = Ville.objects.count()
count_e = Eglise.objects.count()

Region.objects.all().delete()
Ville.objects.all().delete()
Eglise.objects.all().delete()

print(f"✓ Deleted {count_r} regions, {count_v} cities, {count_e} churches")
