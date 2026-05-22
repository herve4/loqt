#!/usr/bin/env python
"""
Importe une liste de matériels de sonorisation dans la base Django.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from logistque.models import Materiel, CategorieMateriel, Logistique, Eglise

# Liste d'exemples de matériels à importer
MATERIELS = [
    {"nom": "Audiophony NOMAD", "categorie": "Sono portable", "quantite": 2},
    {"nom": "Audiophony MOJO", "categorie": "Enceinte colonne", "quantite": 3},
    {"nom": "Audiophony MYOS", "categorie": "Enceinte active", "quantite": 4},
    {"nom": "Audiophony RACER Evo", "categorie": "Enceinte portable", "quantite": 2},
    {"nom": "Console de mixage", "categorie": "Mixage", "quantite": 1},
    {"nom": "Audiophony Nova", "categorie": "Enceinte active", "quantite": 2},
    {"nom": "Système sono amplifié", "categorie": "Sono amplifiée", "quantite": 1},
    {"nom": "Enceinte active", "categorie": "Enceinte active", "quantite": 5},
    {"nom": "Enceinte passive", "categorie": "Enceinte passive", "quantite": 3},
]

def get_or_create_categorie(nom):
    cat, _ = CategorieMateriel.objects.get_or_create(nom=nom)
    return cat


def get_or_create_default_eglise():
    from logistque.models import Region, Ville
    region, _ = Region.objects.get_or_create(nom="Default")
    ville, _ = Ville.objects.get_or_create(nom="DefaultVille", region=region)
    eglise, _ = Eglise.objects.get_or_create(nom="Eglise Centrale", defaults={"ville": ville})
    return eglise

def get_or_create_default_logistique(eglise):
    logistique, _ = Logistique.objects.get_or_create(eglise=eglise)
    return logistique


def run():
    eglise = get_or_create_default_eglise()
    logistique = get_or_create_default_logistique(eglise)
    for item in MATERIELS:
        cat = get_or_create_categorie(item["categorie"])
        materiel, created = Materiel.objects.get_or_create(
            nom=item["nom"],
            defaults={
                "categorie": cat,
                "quantite": item["quantite"],
                "logistique": logistique,
                "eglise": eglise,
            }
        )
        if created:
            print(f"✅ Matériel ajouté : {materiel.nom}")
        else:
            print(f"ℹ️ Matériel déjà existant : {materiel.nom}")

if __name__ == "__main__":
    run()
