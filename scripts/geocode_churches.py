import os
import django
import requests
import time

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from logistque.models import Eglise

def geocode_church(church):
    query = f"{church.nom}, {church.ville.nom}, Côte d'Ivoire"
    print(f"Géocodage de : {query}")
    
    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": query, "format": "json", "limit": 1},
            headers={"User-Agent": "SGL-CI-Logistics-App"}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data:
                church.latitude = float(data[0]['lat'])
                church.longitude = float(data[0]['lon'])
                church.save()
                print(f"  ✅ Succès : {church.latitude}, {church.longitude}")
                return True
            else:
                # Réessayer avec seulement la ville si le nom de l'église est trop spécifique
                query_fallback = f"{church.ville.nom}, Côte d'Ivoire"
                print(f"  ⚠️ Pas de résultat précis, essai avec la ville : {query_fallback}")
                response = requests.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": query_fallback, "format": "json", "limit": 1},
                    headers={"User-Agent": "SGL-CI-Logistics-App"}
                )
                if response.status_code == 200:
                    data = response.json()
                    if data:
                        # Ajouter un petit décalage aléatoire pour que les églises d'une même ville ne se chevauchent pas exactement
                        import random
                        offset_lat = (random.random() - 0.5) * 0.01
                        offset_lon = (random.random() - 0.5) * 0.01
                        church.latitude = float(data[0]['lat']) + offset_lat
                        church.longitude = float(data[0]['lon']) + offset_lon
                        church.save()
                        print(f"  ✅ Succès (ville) : {church.latitude}, {church.longitude}")
                        return True
        
        print(f"  ❌ Échec pour : {church.nom}")
        return False
    except Exception as e:
        print(f"  🔥 Erreur : {e}")
        return False

def main():
    churches = Eglise.objects.filter(latitude__isnull=True)
    count = churches.count()
    print(f"Début du géocodage pour {count} églises...")
    
    for i, church in enumerate(churches):
        geocode_church(church)
        # Limiter le taux de requêtes pour Nominatim (1 requête par seconde recommandé)
        time.sleep(1)
        
    print("Géocodage terminé.")

if __name__ == "__main__":
    main()
