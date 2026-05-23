import os
import sys
import django

# Ajouter le dossier racine du projet au PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from logistque.models import Eglise, PoleCompetence

def run():
    print("=== Début de la mise à jour des données de production ===")

    # 1. Mettre à jour les régions des églises
    print("\n1. Mise à jour des régions des églises...")
    eglises = Eglise.objects.select_related('ville__region').all()
    count = 0
    for eglise in eglises:
        if eglise.ville and eglise.ville.region and eglise.region != eglise.ville.region:
            eglise.region = eglise.ville.region
            eglise.save(update_fields=['region'])
            count += 1
    print(f"✅ {count} églises mises à jour avec leur région.")

    # 2. Création des pôles techniques par défaut
    print("\n2. Création des Pôles Techniques...")
    poles = [
        "Son",
        "Image",
        "Lumière",
        "Informatique",
        "Énergie",
        "Réalisation",
        "Logistique Générale"
    ]
    count_poles = 0
    for nom in poles:
        pole, created = PoleCompetence.objects.get_or_create(nom=nom)
        if created:
            count_poles += 1
    print(f"✅ {count_poles} pôles techniques créés ou mis à jour.")

    print("\n=== Fin de la mise à jour ===")

if __name__ == '__main__':
    run()
