#!/usr/bin/env python
"""
Import Churches, Cities and Regions from CSV to Django ORM
Standalone script that works outside manage.py shell
"""
import os
import sys
import django
import csv

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from logistque.models import Region, Ville, Eglise

def import_from_csv(csv_file='scripts/eglises_import.csv'):
    """Import regions, cities and churches from CSV file"""
    
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), csv_file)
    
    if not os.path.exists(csv_path):
        print(f"❌ CSV file not found: {csv_path}")
        return False
    
    created_count = {'regions': 0, 'villes': 0, 'eglises': 0}
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        if not reader.fieldnames:
            print("❌ CSV file is empty")
            return False
            
        print(f"✓ CSV columns: {reader.fieldnames}")
        
        for row_num, row in enumerate(reader, start=2):
            try:
                region_name = row.get('region', '').strip()
                ville_name = row.get('ville', '').strip()
                eglise_name = row.get('eglise', '').strip()
                
                if not all([region_name, ville_name, eglise_name]):
                    print(f"⚠ Row {row_num}: Missing required fields - skipping")
                    continue
                
                # Get or create Region
                region, region_created = Region.objects.get_or_create(
                    nom=region_name
                )
                if region_created:
                    created_count['regions'] += 1
                    print(f"  + Region: {region_name}")
                
                # Get or create Ville
                ville, ville_created = Ville.objects.get_or_create(
                    nom=ville_name,
                    region=region
                )
                if ville_created:
                    created_count['villes'] += 1
                    print(f"    + City: {ville_name}")
                
                # Get or create Eglise
                eglise, eglise_created = Eglise.objects.get_or_create(
                    nom=eglise_name,
                    defaults={'ville': ville}
                )
                if eglise_created:
                    created_count['eglises'] += 1
                    print(f"      + Church: {eglise_name}")
                    
            except Exception as e:
                print(f"❌ Row {row_num}: {str(e)}")
                continue
    
    print("\n✓ Import complete!")
    print(f"  - Regions created: {created_count['regions']}")
    print(f"  - Cities created: {created_count['villes']}")
    print(f"  - Churches created: {created_count['eglises']}")
    print("\n  Total in DB now:")
    print(f"  - Regions: {Region.objects.count()}")
    print(f"  - Cities: {Ville.objects.count()}")
    print(f"  - Churches: {Eglise.objects.count()}")
    
    return True

if __name__ == '__main__':
    success = import_from_csv()
    sys.exit(0 if success else 1)
