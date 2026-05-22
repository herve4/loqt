#!/usr/bin/env python
"""
Ajoute des sous-catégories pertinentes pour chaque catégorie de matériel et les associe aux matériels existants si possible.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from logistque.models import Materiel, CategorieMateriel, SousCategorieMateriel

# Suggestions de sous-catégories par catégorie
SOUS_CATEGORIES = {
    "Sono portable": ["Tout-en-un", "Avec micro sans fil", "Bluetooth"],
    "Enceinte colonne": ["Colonne"],
    "Enceinte active": ["Portable", "Scène", "Retour"],
    "Enceinte portable": ["Sur batterie", "Compacte"],
    "Mixage": ["Numérique", "Analogique", "Compacte"],
    "Sono amplifiée": ["Système complet"],
    "Enceinte passive": ["Scène", "Retour"],
}

# Association automatique pour les matériels importés
MATERIEL_SOUS_CAT = {
    "Audiophony NOMAD": "Tout-en-un",
    "Audiophony MOJO": "Colonne",
    "Audiophony MYOS": "Portable",
    "Audiophony RACER Evo": "Sur batterie",
    "Console de mixage": "Numérique",
    "Audiophony Nova": "Scène",
    "Système sono amplifié": "Système complet",
    "Enceinte active": "Scène",
    "Enceinte passive": "Scène",
}

def run():
    # Création des sous-catégories
    for cat_nom, sous_cat_list in SOUS_CATEGORIES.items():
        cat = CategorieMateriel.objects.filter(nom=cat_nom).first()
        if not cat:
            print(f"Catégorie non trouvée : {cat_nom}")
            continue
        for sous_nom in sous_cat_list:
            sous, created = SousCategorieMateriel.objects.get_or_create(categorie=cat, nom=sous_nom)
            if created:
                print(f"✅ Sous-catégorie ajoutée : {cat.nom} - {sous.nom}")
    # Association automatique aux matériels
    for mat_nom, sous_nom in MATERIEL_SOUS_CAT.items():
        materiel = Materiel.objects.filter(nom=mat_nom).first()
        if not materiel:
            print(f"Matériel non trouvé : {mat_nom}")
            continue
        cat = materiel.categorie
        sous = SousCategorieMateriel.objects.filter(categorie=cat, nom=sous_nom).first()
        if sous:
            materiel.sous_categorie = sous
            materiel.save()
            print(f"🔗 {materiel.nom} → {sous.nom}")
        else:
            print(f"Sous-catégorie non trouvée pour {mat_nom} : {sous_nom}")

if __name__ == "__main__":
    run()
