#!/usr/bin/env python
"""
Télécharge toutes les images principales de chaque page produit Levenly et les associe au matériel correspondant via la table MaterielImage.
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
from logistque.models import Materiel, MaterielImage

# Mapping matériel -> URL page produit
MATERIEL_PAGES = {
    "Audiophony NOMAD": "https://www.levenly.com/blog/sono-portable-audiophony-nomad.html",
    "Audiophony MOJO": "https://www.levenly.com/blog/enceinte-sono-colonne-audiophony-mojo.html",
    "Audiophony MYOS": "https://www.levenly.com/blog/enceintes-audiophony-myos.html",
    "Audiophony RACER Evo": "https://www.levenly.com/blog/sono-portable-audiophony-racer.html",
    "Console de mixage": "https://www.levenly.com/blog/console-mixage-table-differences-utilisation.html",
    "Audiophony Nova": "https://www.levenly.com/blog/audiophony-nova-enceintes-actives.html",
}

def get_all_image_urls(page_url):
    resp = requests.get(page_url, timeout=10)
    soup = BeautifulSoup(resp.text, 'html.parser')
    # Récupère toutes les images principales de l'article
    imgs = soup.find_all('img')
    urls = []
    for img in imgs:
        src = img.get('src')
        if src and (src.endswith('.jpg') or src.endswith('.jpeg') or src.endswith('.png')):
            urls.append(src if src.startswith('http') else f"https://www.levenly.com{src}")
    return urls

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
        img_urls = get_all_image_urls(page_url)
        if not img_urls:
            print(f"Aucune image trouvée pour {mat_nom}")
            continue
        for idx, img_url in enumerate(img_urls[:5]):
            img_temp = download_image(img_url)
            if not img_temp:
                print(f"Impossible de télécharger l'image {img_url} pour {mat_nom}")
                continue
            ext = os.path.splitext(urlparse(img_url).path)[-1] or '.jpg'
            file_name = f"{mat_nom.replace(' ', '_')}_{idx+1}{ext}"
            materiel_image = MaterielImage(materiel=materiel)
            materiel_image.image.save(file_name, File(img_temp), save=True)
            img_temp.close()
            try:
                os.unlink(img_temp.name)
            except Exception:
                pass
            print(f"✅ Image ajoutée à {mat_nom} (MaterielImage)")

if __name__ == "__main__":
    run()
