import csv
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from logistque.models import Region, Ville, Eglise

CSV_PATH = os.path.join(os.path.dirname(__file__), 'eglises_import.csv')

count_region = 0
count_ville = 0
count_eglise = 0


print(f"Lecture du fichier CSV: {CSV_PATH}")
with open(CSV_PATH, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    print(f"Colonnes détectées: {reader.fieldnames}")
    for idx, row in enumerate(reader, 1):
        print(f"Ligne {idx}: {row}")
        region_name = row.get('region') or row.get('Region')
        ville_name = row.get('ville') or row.get('Ville')
        eglise_name = row.get('eglise') or row.get('Eglise')
        if not (region_name and ville_name and eglise_name):
            print(f"Ligne ignorée (incomplète): {row}")
            continue
        region, created = Region.objects.get_or_create(nom=region_name.strip())
        if created:
            count_region += 1
        ville, created = Ville.objects.get_or_create(nom=ville_name.strip(), region=region)
        if created:
            count_ville += 1
        eglise, created = Eglise.objects.get_or_create(nom=eglise_name.strip(), ville=ville)
        if created:
            count_eglise += 1

print("Import terminé!")
print(f"Régions créées: {count_region}")
print(f"Villes créées: {count_ville}")
print(f"Églises créées: {count_eglise}")
