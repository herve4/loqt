#!/bin/bash
set -e

# Charger les variables d'environnement
if [ ! -f .env ]; then
    echo "Création du fichier .env à partir de .env.example"
    cp .env.example .env
    echo "Veuillez configurer les variables dans .env avant de continuer"
    exit 1
fi

# Créer les dossiers nécessaires
mkdir -p docker/nginx/ssl

# Générer un certificat auto-signé si nécessaire
if [ ! -f docker/nginx/ssl/cert.pem ] || [ ! -f docker/nginx/ssl/key.pem ]; then
    echo "Génération d'un certificat SSL auto-signé..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/nginx/ssl/key.pem \
        -out docker/nginx/ssl/cert.pem \
        -subj "/C=FR/ST=France/L=Paris/O=LOQT/CN=localhost"
fi

# Construire les images
echo "Construction des images Docker..."
docker-compose build

# Démarrer les conteneurs en arrière-plan
echo "Démarrage des conteneurs..."
docker-compose up -d

# Attendre que la base de données soit prête
echo "Attente du démarrage de la base de données..."
until docker-compose exec -T db pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; do
    sleep 1
done

# Appliquer les migrations
echo "Application des migrations..."
docker-compose exec -T web python manage.py migrate

# Collecter les fichiers statiques
echo "Collecte des fichiers statiques..."
docker-compose exec -T web python manage.py collectstatic --noinput

# Créer un superutilisateur si nécessaire
if [ "$CREATE_SUPERUSER" = "true" ]; then
    echo "Création d'un superutilisateur..."
    docker-compose exec -T web python manage.py createsuperuser --noinput || true
fi

echo "\nDéploiement terminé avec succès !"
echo "- Application principale : https://localhost"
echo "- Interface Ngrok : http://localhost:4040"
echo "- Pour voir les logs : docker-compose logs -f"
