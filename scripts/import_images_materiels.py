#!/usr/bin/env python
"""
Télécharge la première image de chaque page produit Levenly et l'associe au matériel correspondant dans la base Django.
"""
import os
import sys
import django
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from logistque.models import Materiel

# Mapping matériel -> URL page produit
MATERIEL_PAGES = {
    "Audiophony NOMAD": "https://www.levenly.com/blog/sono-portable-audiophony-nomad.html",
    "Audiophony MOJO": "https://www.levenly.com/blog/enceinte-sono-colonne-audiophony-mojo.html",
    "Audiophony MYOS": "https://www.levenly.com/blog/enceintes-audiophony-myos.html",
    "Audiophony RACER Evo": "https://www.levenly.com/blog/sono-portable-audiophony-racer.html",
    "Console de mixage": "https://www.levenly.com/blog/console-mixage-table-differences-utilisation.html",
    "Audiophony Nova": "https://www.levenly.com/blog/audiophony-nova-enceintes-actives.html",
}

MEDIA_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'media', 'materiels')
os.makedirs(MEDIA_ROOT, exist_ok=True)

def get_first_image_url(page_url):
    resp = requests.get(page_url, timeout=10)
    soup = BeautifulSoup(resp.text, 'html.parser')
    # Cherche la première image principale de l'article
    img = soup.find('img')
    if img and img.get('src'):
        return img['src'] if img['src'].startswith('http') else f"https://www.levenly.com{img['src']}"
    return None

def download_image(url):
    resp = requests.get(url, stream=True, timeout=10)
    if resp.status_code == 200:
        img_temp = NamedTemporaryFile()
        for chunk in resp.iter_content(1024):
            img_temp.write(chunk)
        img_temp.flush()
        return img_temp
    return None

def run():
    for mat_nom, page_url in MATERIEL_PAGES.items():
        materiel = Materiel.objects.filter(nom=mat_nom).first()
        if not materiel:
            print(f"Matériel non trouvé : {mat_nom}")
            continue
        img_url = get_first_image_url(page_url)
        if not img_url:
            print(f"Aucune image trouvée pour {mat_nom}")
            continue
        img_temp = download_image(img_url)
        if not img_temp:
            print(f"Impossible de télécharger l'image pour {mat_nom}")
            continue
        # Extension du fichier
        ext = os.path.splitext(urlparse(img_url).path)[-1] or '.jpg'
        file_name = f"{mat_nom.replace(' ', '_')}{ext}"
        materiel.image.save(file_name, File(img_temp), save=True)
        img_temp.close()
        try:
            os.unlink(img_temp.name)
        except Exception:
            pass
        print(f"✅ Image associée à {mat_nom}")

if __name__ == "__main__":
    run()
