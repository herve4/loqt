# LOQT - Système de Gestion Logistique

Application web de gestion logistique développée avec Django et des fonctionnalités temps réel avec Django Channels et Redis, daphne.

## Fonctionnalités principales

- Gestion des utilisateurs et des rôles
- Suivi des événements en temps réel
- Système de notifications temps réel
- Gestion des stocks et des commandes
- Tableaux de bord interactifs

## Prérequis

- Python 3.8+
- PostgreSQL
- Redis
- Node.js (pour la gestion des assets frontend)
- pip (gestionnaire de paquets Python)

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-utilisateur/loqt.git
cd loqt
```

### 2. Créer et activer un environnement virtuel

```bash
# Sur Windows
python -m venv venv
.\venv\Scripts\activate

# Sur macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configurer les variables d'environnement

1. Copiez le fichier `.env.example` vers `.env` :
   ```bash
   copy .env.example .env  # Windows
   cp .env.example .env    # macOS/Linux
   ```

2. Modifiez le fichier `.env` avec vos paramètres :
   - `SECRET_KEY` : Clé secrète Django (générez-en une nouvelle pour la production)
   - `DEBUG` : `True` en développement, `False` en production
   - Variables de base de données
   - Configuration Redis
   - Paramètres d'email

### 5. Configurer la base de données

1. Créez une base de données PostgreSQL
2. Exécutez les migrations :
   ```bash
   python manage.py migrate
   ```
3. Créez un superutilisateur :
   ```bash
   python manage.py createsuperuser
   ```

### 6. Installer les dépendances frontend

```bash
npm install  # Ou yarn install
```

### 7. Compiler les assets statiques

```bash
npm run build  # Ou le script approprié défini dans package.json
```

## Démarrage en développement

1. Démarrer le serveur de développement Django :
   ```bash
   python manage.py runserver
   ```

2. Démarrer le rechargement automatique des assets (si configuré) :
   ```bash
   npm run dev
   ```

3. Accéder à l'application : http://127.0.0.1:8000/

## Déploiement en production

### Prérequis

- Serveur Linux (Ubuntu 20.04+ recommandé)
- Nginx
- Gunicorn
- PostgreSQL
- Redis
- Certbot (pour HTTPS)

### Étapes de déploiement

1. **Mettre à jour le système**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Installer les dépendances système**
   ```bash
   sudo apt install -y python3-pip python3-dev python3-venv libpq-dev postgresql postgresql-contrib nginx redis-server
   ```

3. **Configurer PostgreSQL**
   ```sql
   sudo -u postgres psql
   CREATE DATABASE loqt_prod;
   CREATE USER loqtuser WITH PASSWORD 'votre_mot_de_passe';
   ALTER ROLE loqtuser SET client_encoding TO 'utf8';
   ALTER ROLE loqtuser SET default_transaction_isolation TO 'read committed';
   ALTER ROLE loqtuser SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE loqt_prod TO loqtuser;
   \q
   ```

4. **Configurer Redis**
   ```bash
   sudo nano /etc/redis/redis.conf
   ```
   Modifiez les paramètres suivants :
   ```
   bind 127.0.0.1
   requirepass votre_mot_de_passe_redis
   ```
   Puis redémarrez Redis :
   ```bash
   sudo systemctl restart redis-server
   ```

5. **Configurer l'application**
   - Cloner le dépôt
   - Créer et activer un environnement virtuel
   - Installer les dépendances
   - Configurer le fichier `.env` pour la production
   - Exécuter les migrations
   - Collecter les fichiers statiques :
     ```bash
     python manage.py collectstatic --noinput
     ```

6. **Configurer Gunicorn**
   Créez un fichier de service systemd pour Gunicorn :
   ```bash
   sudo nano /etc/systemd/system/gunicorn.service
   ```
   Contenu du fichier :
   ```ini
   [Unit]
   Description=Gunicorn service for LOQT
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/chemin/vers/loqt
   ExecStart=/chemin/vers/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/run/loqt.sock loqt.asgi:application -k uvicorn.workers.UvicornWorker
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   Puis activez et démarrez le service :
   ```bash
   sudo systemctl enable gunicorn
   sudo systemctl start gunicorn
   ```

7. **Configurer Nginx**
   Créez un fichier de configuration pour votre site :
   ```bash
   sudo nano /etc/nginx/sites-available/loqt
   ```
   Configuration de base :
   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com www.votre-domaine.com;

       location = /favicon.ico { access_log off; log_not_found off; }

       location /static/ {
           root /chemin/vers/loqt;
       }

       location /media/ {
           root /chemin/vers/loqt;
       }

       location / {
           include proxy_params;
           proxy_pass http://unix:/run/loqt.sock;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_redirect off;
       }
   }
   ```
   Activez le site et testez la configuration :
   ```bash
   sudo ln -s /etc/nginx/sites-available/loqt /etc/nginx/sites-enabled
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Configurer HTTPS avec Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
   ```
   Suivez les instructions pour configurer la redirection HTTP vers HTTPS.

## Documentation supplémentaire

- [Documentation des notifications en production](docs/NOTIFICATIONS_PRODUCTION.md)
- [Guide de contribution](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
