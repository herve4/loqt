#!/bin/bash
set -e

# Vérifier que le token Ngrok est défini
if [ -z "$NGROK_AUTH_TOKEN" ]; then
    echo "Erreur : La variable NGROK_AUTH_TOKEN n'est pas définie dans .env"
    exit 1
fi

echo "Configuration de Ngrok avec le token : $NGROK_AUTH_TOKEN"

# Arrêter le conteneur Ngrok s'il est en cours d'exécution
docker-compose stop ngrok || true

# Démarrer le conteneur Ngrok
docker-compose up -d ngrok

# Attendre que Ngrok soit prêt
echo "Attente du démarrage de Ngrok..."
sleep 5

# Vérifier que Ngrok est en cours d'exécution
if ! docker-compose ps | grep -q "ngrok.*Up"; then
    echo "Erreur : Impossible de démarrer le conteneur Ngrok"
    exit 1
fi

# Configurer le token d'authentification
docker-compose exec -T ngrok ngrok config add-authtoken "$NGROK_AUTH_TOKEN"

# Redémarrer Ngrok pour appliquer les modifications
docker-compose restart ngrok

echo "\nNgrok configuré avec succès !"
echo "Pour obtenir l'URL publique :"
echo "1. Allez sur http://localhost:4040"
echo "2. Notez l'URL https://xxxx-xx-xx-xx-xx.ngrok.io"

# Si un domaine personnalisé est défini, l'utiliser
if [ -n "$NGROK_DOMAIN" ]; then
    echo "\nConfiguration du domaine personnalisé : $NGROK_DOMAIN"
    echo "Assurez-vous d'avoir configuré ce domaine dans votre tableau de bord Ngrok"
    
    # Arrêter et redémarrer Ngrok avec le domaine personnalisé
    docker-compose stop ngrok
    docker-compose up -d ngrok
    
    echo "Ngrok redémarré avec le domaine : $NGROK_DOMAIN"
fi

echo "\nPour accéder à votre application via Ngrok :"
echo "- Interface Ngrok : http://localhost:4040"
echo "- Votre application sera disponible à l'URL affichée ci-dessus"
