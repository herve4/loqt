#!/usr/bin/env python
"""Verify import - check data in database"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from logistque.models import Region, Ville, Eglise

print("=" * 60)
print("DATA IMPORT VERIFICATION")
print("=" * 60)

print(f"\n✓ Total Regions: {Region.objects.count()}")
for region in Region.objects.all():
    cities = region.ville_set.all()
    churches = Eglise.objects.filter(ville__region=region)
    print(f"  - {region.nom}: {cities.count()} cities, {churches.count()} churches")

print(f"\n✓ Total Cities: {Ville.objects.count()}")
print(f"✓ Total Churches: {Eglise.objects.count()}")

print("\n" + "=" * 60)
print("SAMPLE CHURCHES")
print("=" * 60)
for church in Eglise.objects.all()[:5]:
    print(f"  • {church.nom}")
    print(f"    City: {church.ville.nom}")
    print(f"    Region: {church.ville.region.nom}")
    print()
