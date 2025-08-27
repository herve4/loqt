# Configuration des Notifications en Production

Ce document décrit la configuration et l'utilisation du système de notifications en temps réel dans l'application LOQT.

## Prérequis

1. **Redis** doit être installé et configuré sur le serveur de production
2. Les dépendances Python requises doivent être installées (voir `requirements.txt`)
3. Les variables d'environnement doivent être correctement configurées (voir `.env.example`)

## Configuration Redis

### Installation (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Configuration de sécurité

1. Modifiez le fichier de configuration Redis :
   ```bash
   sudo nano /etc/redis/redis.conf
   ```

2. Assurez-vous que les paramètres suivants sont configurés :
   ```
   bind 127.0.0.1  # N'écoute que sur localhost
   protected-mode yes
   requirepass votre_mot_de_passe_secure  # Définissez un mot de passe fort
   maxmemory 256mb  # Limite la mémoire utilisée par Redis
   maxmemory-policy allkeys-lru  # Stratégie d'éviction LRU
   ```

3. Redémarrez Redis :
   ```bash
   sudo systemctl restart redis-server
   ```

## Configuration Django

### Variables d'environnement

Assurez-vous que les variables suivantes sont définies dans votre fichier `.env` :

```
# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=votre_mot_de_passe_secure
REDIS_DB=0
```

### Configuration Channels

La configuration des canaux se trouve dans `settings.py`. En production, elle utilise automatiquement Redis avec les paramètres définis ci-dessus.

## Surveillance et Maintenance

### Vérification de l'état de Redis

```bash
# Vérifier l'état du service
sudo systemctl status redis-server

# Se connecter à Redis en ligne de commande
redis-cli -a "votre_mot_de_passe_secure"

# Voir les statistiques
redis-cli -a "votre_mot_de_passe_secure" INFO
```

### Nettoyage des anciennes données

Pour nettoyer les anciennes données Redis, vous pouvez utiliser :

```bash
# Nettoyer toutes les clés (attention, supprime tout !)
redis-cli -a "votre_mot_de_passe_secure" FLUSHALL

# Nettoyer uniquement la base de données utilisée par l'application
redis-cli -a "votre_mot_de_passe_secure" -n 0 FLUSHDB
```

### Surveillance des performances

```bash
# Voir les connexions actives
redis-cli -a "votre_mot_de_passe_secure" CLIENT LIST

# Voir les commandes lentes
redis-cli -a "votre_mot_de_passe_secure" SLOWLOG GET 10
```

## Dépannage

### Les notifications ne s'affichent pas

1. Vérifiez que Redis est en cours d'exécution :
   ```bash
   sudo systemctl status redis-server
   ```

2. Vérifiez les logs de l'application Django pour les erreurs de connexion à Redis.

3. Vérifiez que les WebSockets sont correctement configurés dans votre serveur web (Nginx/Apache).

### Connexion Redis refusée

1. Vérifiez que Redis écoute sur l'adresse et le port corrects :
   ```bash
   sudo netstat -tulpn | grep redis
   ```

2. Vérifiez que le mot de passe dans `.env` correspond à celui dans la configuration Redis.

## Sécurité

- Ne jamais exposer le port Redis (6379) sur Internet
- Utiliser toujours un mot de passe fort pour Redis
- Mettre à jour régulièrement Redis pour corriger les failles de sécurité
- Configurer des sauvegardes régulières des données Redis si nécessaire

## Sauvegarde et Restauration

### Sauvegarder les données Redis

```bash
# Créer une sauvegarde RDB
redis-cli -a "votre_mot_de_passe_secure" SAVE

# La sauvegarde sera créée à l'emplacement configuré dans redis.conf (généralement /var/lib/redis/dump.rdb)
```

### Restaurer à partir d'une sauvegarde

1. Arrêtez Redis :
   ```bash
   sudo systemctl stop redis-server
   ```

2. Remplacez le fichier de dump :
   ```bash
   sudo cp /chemin/vers/votre/sauvegarde/dump.rdb /var/lib/redis/dump.rdb
   sudo chown redis:redis /var/lib/redis/dump.rdb
   sudo chmod 660 /var/lib/redis/dump.rdb
   ```

3. Redémarrez Redis :
   ```bash
   sudo systemctl start redis-server
   ```
