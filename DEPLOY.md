# Guide de Déploiement LOQT

Ce document explique comment déployer l'application LOQT en production avec Docker, PostgreSQL et Ngrok.

## Prérequis

- Docker et Docker Compose installés sur le serveur
- Un compte Ngrok (gratuit) pour l'accès public
- Un nom de domaine (optionnel)

## Configuration initiale

1. **Cloner le dépôt**
   ```bash
   git clone <url-du-depot> loqt
   cd loqt
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   nano .env  # Éditer avec vos paramètres
   ```

3. **Rendre les scripts exécutables**
   ```bash
   chmod +x docker/scripts/*.sh
   ```

## Déploiement

1. **Lancer le déploiement**
   ```bash
   ./docker/scripts/deploy.sh
   ```

2. **Configurer Ngrok**
   ```bash
   ./docker/scripts/setup-ngrok.sh
   ```
   Notez l'URL Ngrok fournie (du type `https://xxxx-xx-xx-xx-xx.ngrok.io`)

3. **Créer un superutilisateur** (si nécessaire)
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

## Mise à jour de l'application

```bash
./docker/scripts/update.sh
```

## Sauvegarde des données

Pour créer une sauvegarde de la base de données et des médias :

```bash
./docker/scripts/backup.sh
```

Les sauvegardes sont stockées dans le dossier `./backups/` et conservées pendant 7 jours.

## Configuration avancée

### Configuration du domaine personnalisé

1. Allez sur [le tableau de bord Ngrok](https://dashboard.ngrok.com/)
2. Dans "Domains", réservez un sous-domaine
3. Mettez à jour `.env` :
   ```
   NGROK_DOMAIN=votre-sous-domaine.ngrok.io
   ```
4. Redémarrez Ngrok :
   ```bash
   ./docker/scripts/setup-ngrok.sh
   ```

### Configuration SSL

Un certificat auto-signé est généré automatiquement. Pour un certificat Let's Encrypt :

1. Installez Certbot sur votre serveur
2. Arrêtez le conteneur Nginx
3. Exécutez :
   ```bash
   certbot certonly --standalone -d votre-domaine.com
   ```
4. Mettez à jour `docker/nginx/nginx.conf` avec les chemins des certificats

### Surveillance

- **Logs** : `docker-compose logs -f`
- **Statut des conteneurs** : `docker-compose ps`
- **Interface Ngrok** : http://localhost:4040

## Dépannage

### Réinitialiser la base de données

```bash
docker-compose down -v
docker-compose up -d
```

### Problèmes courants

- **Erreurs de connexion à la base de données** : Vérifiez les logs avec `docker-compose logs db`
- **Problèmes de permissions** : Assurez-vous que les dossiers `media/` et `staticfiles/` sont accessibles en écriture
- **Ngrok ne fonctionne pas** : Vérifiez que le token est valide et que le port 4040 n'est pas bloqué

## Sécurité

- Changez tous les mots de passe par défaut
- Ne laissez pas `DEBUG=True` en production
- Mettez à jour régulièrement les conteneurs Docker
- Configurez un pare-feu pour limiter l'accès aux ports

## Support

Pour toute question ou problème, ouvrez une issue sur le dépôt ou contactez l'équipe de développement.

---

## 🤖 GitHub Actions — Déploiement Automatique

Le déploiement est automatisé via `.github/workflows/deploy.yml`. Chaque `push` sur `master` déclenche un déploiement.

### ⚠️ Étape critique — Autoriser la clé SSH sur le serveur

La clé SSH a été générée sur le serveur. Il faut autoriser la clé publique :

```bash
# Sur le VPS
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 🔑 Secrets requis sur GitHub

Allez sur : `https://github.com/herve4/loqt/settings/secrets/actions`

| Secret | Valeur |
|--------|--------|
| `SSH_HOST` | IP ou domaine du VPS |
| `SSH_USER` | `herve` |
| `SSH_KEY` | Contenu de `~/.ssh/id_ed25519` (clé **privée** entière) |
| `SSH_PORT` | `22` |

**Copier la clé privée :**
```bash
cat ~/.ssh/id_ed25519
```

### 🔄 Flux de déploiement

```
Push sur master → Build frontend → SSH → git pull → docker build → docker up → health-check
```

### 🧪 Déclencher manuellement

1. Aller sur `https://github.com/herve4/loqt/actions`
2. Cliquer sur **"Deploy to Production"**
3. Bouton **"Run workflow"** → `master`
