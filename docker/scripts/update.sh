#!/bin/bash
set -e

echo "Mise à jour du code source..."
git pull

echo "Arrêt des conteneurs..."
docker-compose down

echo "Reconstruction des images..."
docker-compose build

echo "Démarrage des conteneurs..."
docker-compose up -d

echo "Attente du démarrage de la base de données..."
until docker-compose exec -T db pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; do
    sleep 1
done

echo "Application des migrations..."
docker-compose exec -T web python manage.py migrate

echo "Collecte des fichiers statiques..."
docker-compose exec -T web python manage.py collectstatic --noinput

echo "Redémarrage des services..."
docker-compose restart

echo "\nMise à jour terminée avec succès !"
