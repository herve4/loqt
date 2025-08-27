# Surveillance de Redis en Production

## Installation

1. Copiez les fichiers nécessaires :
   ```bash
   mkdir -p /opt/loqt/scripts
   cp scripts/monitor_redis.py /opt/loqt/scripts/
   cp scripts/redis_monitor_config.json /opt/loqt/scripts/
   chmod +x /opt/loqt/scripts/monitor_redis.py
   ```

2. Installez les dépendances :
   ```bash
   pip install redis
   ```

## Configuration

Modifiez `/opt/loqt/scripts/redis_monitor_config.json` :

```json
{
    "redis_host": "localhost",
    "redis_port": 6379,
    "redis_password": "votre_mot_de_passe_redis",
    "redis_db": 0,
    "warning_threshold": 80,
    "critical_threshold": 90,
    "alert_emails": ["admin@votredomaine.com"],
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_user": "votre-email@gmail.com",
    "smtp_password": "votre-mot-de-passe",
    "from_email": "monitoring@votredomaine.com"
}
```

## Utilisation

### Exécution manuelle
```bash
python3 /opt/loqt/scripts/monitor_redis.py
```

### Planification avec Cron
```bash
# Éditer le crontab
sudo crontab -e

# Ajouter cette ligne pour une exécution toutes les 5 minutes
*/5 * * * * /chemin/vers/python3 /opt/loqt/scripts/monitor_redis.py >> /var/log/redis_monitor.log 2>&1
```

## Codes de sortie
- `0` : Tout est normal
- `1` : Avertissement
- `2` : Critique
- `3` : Erreur

## Dépannage
- Vérifiez les logs : `/var/log/redis_monitor.log`
- Testez la connexion Redis : `redis-cli ping`
- Vérifiez les paramètres SMTP pour les alertes par email
