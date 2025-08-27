# Guide de Configuration en Production : Système de Notifications

Ce document fournit des instructions détaillées pour configurer et déployer le système de notifications en production.

## Table des matières

1. [Prérequis](#prérequis)
2. [Configuration du Serveur](#configuration-du-serveur)
3. [Configuration de Redis](#configuration-de-redis)
4. [Configuration de Django Channels](#configuration-de-django-channels)
5. [Configuration du Serveur Web](#configuration-du-serveur-web)
6. [Surveillance et Maintenance](#surveillance-et-maintenance)
7. [Dépannage](#dépannage)
8. [Sauvegarde et Récupération](#sauvegarde-et-récupération)
9. [Mise à l'échelle](#mise-à-léchelle)
10. [Sécurité](#sécurité)

## Prérequis

- Serveur Linux (Ubuntu 20.04/22.04 LTS recommandé)
- Python 3.8+
- Redis 6.0+
- Nginx 1.18+
- PostgreSQL 12+ (ou votre base de données préférée)
- Certificat SSL (Let's Encrypt recommandé)

## Configuration du Serveur

### 1. Mise à jour du système

```bash
# Mettre à jour les paquets système
sudo apt update && sudo apt upgrade -y

# Installer les dépendances système
sudo apt install -y \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libpq-dev \
    redis-server \
    nginx \
    supervisor \
    certbot \
    python3-certbot-nginx
```

### 2. Configuration de l'environnement

Créez un utilisateur dédié pour l'application :

```bash
# Créer un utilisateur pour l'application
sudo adduser --system --group --no-create-home loqt
sudo usermod -aG loqt www-data
```

### 3. Répertoires de l'application

```bash
# Créer les répertoires nécessaires
sudo mkdir -p /var/www/loqt
sudo mkdir -p /var/log/loqt
sudo mkdir -p /var/run/loqt

# Définir les permissions
sudo chown -R loqt:loqt /var/www/loqt
sudo chown -R loqt:loqt /var/log/loqt
sudo chown -R loqt:loqt /var/run/loqt

# Permettre à Nginx de lire les fichiers statiques
sudo chmod -R 755 /var/www/loqt/static
```

## Configuration de Redis

### 1. Installation

```bash
# Installer Redis
sudo apt install -y redis-server
```

### 2. Configuration

Éditez le fichier de configuration Redis :

```bash
sudo nano /etc/redis/redis.conf
```

Modifiez les paramètres suivants :

```ini
# Écouter sur toutes les interfaces (modifier selon vos besoins)
bind 127.0.0.1 ::1

# Activer la persistance
appendonly yes
appendfilename "appendonly.aof"

# Limiter l'utilisation mémoire (ajuster selon vos besoins)
maxmemory 256mb
maxmemory-policy allkeys-lru

# Activer la protection mode protégé
protected-mode yes

# Définir un mot de passe (remplacez 'votre_mot_de_passe_redis' par un mot de passe fort)
requirepass votre_mot_de_passe_redis
```

### 3. Redémarrer Redis

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 4. Vérifier l'état de Redis

```bash
redis-cli ping
# Devrait répondre: PONG
```

## Configuration de Django Channels

### 1. Installation des dépendances Python

```bash
# Créer un environnement virtuel
python3 -m venv /var/www/loqt/venv
source /var/www/loqt/venv/bin/activate

# Installer les dépendances
pip install --upgrade pip
pip install -r /var/www/loqt/requirements.txt
```

### 2. Configuration des paramètres Django

Éditez le fichier `settings.py` de votre projet :

```python
# Paramètres ASGI/Channels
ASGI_APPLICATION = 'loqt.asgi.application'

# Configuration des canaux
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(
                'localhost', 
                6379, 
                {
                    'password': 'votre_mot_de_passe_redis',
                    'socket_timeout': 5,
                    'socket_connect_timeout': 5,
                    'retry_on_timeout': True,
                }
            )],
            "prefix": "loqt_ws_",
            "channel_capacity": {
                "http.request": 200,
                "http.response*": 100,
                re.compile(r"^websocket.send\..*"): 1000,
            },
        },
    },
}

# Paramètres de performance pour les WebSockets
CHANNEL_LAYER_WEBSOCKETS = {
    'expiry': 10,  # secondes
    'capacity': 1000,  # messages en mémoire
    'group_expiry': 86400,  # secondes (1 jour)
}

# Configuration des sessions pour les WebSockets
SESSION_COOKIE_AGE = 1209600  # 2 semaines en secondes
SESSION_SAVE_EVERY_REQUEST = True
```

### 3. Configuration ASGI

Éditez le fichier `asgi.py` à la racine de votre projet :

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path, re_path
from logistique.consumers import NotificationConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')

# Application Django par défaut (pour HTTP/HTTPS)
django_asgi_app = get_asgi_application()

# Configuration du routage WebSocket
websocket_urlpatterns = [
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
]

# Configuration ASGI complète
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
```

## Configuration du Serveur Web

### 1. Configuration de Daphne (ASGI)

Créez un fichier de configuration pour Daphne :

```bash
sudo nano /etc/supervisor/conf.d/loqt_daphne.conf
```

Ajoutez la configuration suivante :

```ini
[program:loqt_daphne]
command=/var/www/loqt/venv/bin/daphne \
    -u /var/run/loqt/daphne.sock \
    --access-log - \
    --proxy-headers \
    loqt.asgi:application

directory=/var/www/loqt
user=loqt
group=www-data
numprocs=1
stdout_logfile=/var/log/loqt/daphne.log
stderr_logfile=/var/log/loqt/daphne_error.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=60
killasgroup=true
priority=998
```

### 2. Configuration de Supervisord pour les workers

Créez un fichier pour les workers ASGI :

```bash
sudo nano /etc/supervisor/conf.d/loqt_workers.conf
```

Ajoutez la configuration suivante :

```ini
[program:loqt_worker]
command=/var/www/loqt/venv/bin/python manage.py runworker --threads 4

directory=/var/www/loqt
user=loqt
group=www-data
numprocs=2
process_name=%(program_name)s_%(process_num)02d
stdout_logfile=/var/log/loqt/worker_%(process_num)02d.log
stderr_logfile=/var/log/loqt/worker_%(process_num)02d_error.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=60
killasgroup=true
priority=997
```

### 3. Configuration de Nginx

Créez un fichier de configuration Nginx :

```bash
sudo nano /etc/nginx/sites-available/loqt
```

Ajoutez la configuration suivante :

```nginx
# Configuration HTTP -> Redirection vers HTTPS
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Rediriger tout le trafic vers HTTPS
    return 301 https://$host$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Chemins des certificats SSL (à générer avec Certbot)
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    # Paramètres SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # En-têtes de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Fichiers statiques
    location /static/ {
        alias /var/www/loqt/static/;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, no-transform";
    }
    
    # Fichiers média
    location /media/ {
        alias /var/www/loqt/media/;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, no-transform";
    }
    
    # Configuration WebSocket
    location /ws/ {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_pass http://unix:/var/run/loqt/daphne.sock;
    }
    
    # Configuration Django
    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
        
        # Taille maximale des requêtes
        client_max_body_size 100M;
        
        # Proxy vers Gunicorn ou Daphne
        proxy_pass http://unix:/var/run/loqt/daphne.sock;
    }
    
    # Désactiver l'accès aux dossiers cachés
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Désactiver l'accès aux fichiers de logs
    location ~* \.(log|txt|sql)$ {
        deny all;
    }
}
```

### 4. Activer la configuration Nginx

```bash
# Créer un lien symbolique
sudo ln -s /etc/nginx/sites-available/loqt /etc/nginx/sites-enabled/

# Tester la configuration Nginx
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 5. Obtenir un certificat SSL avec Certbot

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Configurer le renouvellement automatique
sudo certbot renew --dry-run
```

## Surveillance et Maintenance

### 1. Vérifier l'état des services

```bash
# Vérifier l'état de Nginx
sudo systemctl status nginx

# Vérifier l'état de Redis
sudo systemctl status redis-server

# Vérifier l'état de Supervisord
sudo systemctl status supervisor

# Vérifier les logs de Daphne
tail -f /var/log/loqt/daphne.log

# Vérifier les logs des workers
tail -f /var/log/loqt/worker_*.log
```

### 2. Surveillance des performances

Installez des outils de surveillance :

```bash
# Installer des outils utiles
sudo apt install -y htop iotop iftop nmon

# Voir les connexions actives
ss -tulpn

# Voir l'utilisation du CPU et de la mémoire
top

# Voir l'utilisation du disque
df -h

# Voir l'utilisation du réseau
iftop -n
```

### 3. Nettoyage des anciennes notifications

Créez une tâche cron pour nettoyer les anciennes notifications :

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour exécuter le nettoyage tous les jours à minuit
0 0 * * * /var/www/loqt/venv/bin/python /var/www/loqt/manage.py clearnotifications --days=30
```

## Dépannage

### 1. Problèmes de connexion WebSocket

**Symptômes** : Les notifications en temps réel ne fonctionnent pas, erreurs 400/403/502 dans les logs.

**Solutions** :

1. Vérifiez que Redis est en cours d'exécution :
   ```bash
   redis-cli ping
   # Devrait répondre: PONG
   ```

2. Vérifiez les logs de Daphne :
   ```bash
   tail -f /var/log/loqt/daphne.log
   ```

3. Vérifiez les logs Nginx :
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. Vérifiez les permissions des sockets :
   ```bash
   sudo chown -R loqt:www-data /var/run/loqt
   ```

### 2. Problèmes de performances

**Symptômes** : Lenteur des notifications, déconnexions fréquentes.

**Solutions** :

1. Augmentez le nombre de workers dans la configuration Supervisord.
2. Ajustez les paramètres de Redis :
   ```bash
   sudo nano /etc/redis/redis.conf
   ```
   Augmentez `maxmemory` si nécessaire.

3. Activez la compression WebSocket dans Nginx :
   ```nginx
   # Dans la configuration Nginx, bloc server
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

## Sauvegarde et Récupération

### 1. Sauvegarde de la base de données

Créez un script de sauvegarde :

```bash
#!/bin/bash

# Variables
BACKUP_DIR="/var/backups/loqt"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="loqt_db"
DB_USER="loqt_user"

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Sauvegarder la base de données
pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$BACKUP_DIR/loqt_db_$DATE.dump"

# Sauvegarder les médias
tar -czf "$BACKUP_DIR/loqt_media_$DATE.tar.gz" /var/www/loqt/media/

# Supprimer les sauvegardes de plus de 30 jours
find "$BACKUP_DIR" -type f -mtime +30 -delete

# Journaliser la sauvegarde
echo "Sauvegarde effectuée le $(date) dans $BACKUP_DIR" >> "$BACKUP_DIR/backup.log"
```

### 2. Planification des sauvegardes

Ajoutez une tâche cron pour exécuter la sauvegarde quotidiennement :

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour exécuter la sauvegarde tous les jours à 2h du matin
0 2 * * * /chemin/vers/script_sauvegarde.sh
```

## Mise à l'échelle

### 1. Mise à l'échelle verticale

- Augmentez les ressources du serveur (CPU, RAM)
- Ajustez les paramètres de Redis et Nginx en conséquence

### 2. Mise à l'échelle horizontale

1. Configurez plusieurs serveurs d'application
2. Utilisez un équilibreur de charge (HAProxy, AWS ALB, etc.)
3. Configurez Redis en cluster
4. Utilisez un CDN pour les fichiers statiques

## Sécurité

### 1. Mises à jour de sécurité

```bash
# Mettre à jour régulièrement le système
sudo apt update && sudo apt upgrade -y

# Mettre à jour les dépendances Python
/var/www/loqt/venv/bin/pip list --outdated
/var/www/loqt/venv/bin/pip install --upgrade -r /var/www/loqt/requirements.txt
```

### 2. Pare-feu

```bash
# Installer UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Configurer les règles de base
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# Activer le pare-feu
sudo ufw enable

# Vérifier l'état
sudo ufw status verbose
```

### 3. Surveillance des journaux

Installez et configurez un outil de surveillance des journaux comme Logwatch ou Fail2ban :

```bash
# Installer Fail2ban
sudo apt install -y fail2ban

# Copier la configuration par défaut
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Éditer la configuration
sudo nano /etc/fail2ban/jail.local

# Redémarrer Fail2ban
sudo systemctl restart fail2ban
```

## Conclusion

Ce guide couvre la configuration complète du système de notifications en production. Pour des environnements de production critiques, envisagez :

1. Une configuration de haute disponibilité avec plusieurs serveurs
2. Une surveillance avancée avec des outils comme Prometheus et Grafana
3. Des sauvegardes automatisées hors site
4. Un plan de reprise d'activité (PRA)

Pour toute question ou assistance supplémentaire, veuillez consulter la documentation officielle ou contacter l'équipe de support.
