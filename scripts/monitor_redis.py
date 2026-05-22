#!/usr/bin/env python3
"""
Script de surveillance de Redis pour l'application LOQT.

Ce script permet de surveiller les performances et la santé d'une instance Redis,
et peut être exécuté manuellement ou planifié via cron.
"""
import os
import sys
import json
import argparse
import redis
import smtplib
from email.mime.text import MIMEText
from datetime import datetime

# Configuration par défaut
DEFAULT_CONFIG = {
    'redis_host': 'localhost',  # Remplacez par votre hôte Redis
    'redis_port': 6379,         # Port Redis par défaut
    'redis_password': '',       # Mot de passe Redis (si nécessaire)
    'redis_db': 0,              # Base de données Redis à surveiller
    'warning_threshold': 90,    # Seuil d'avertissement pour l'utilisation de la mémoire (%)
    'critical_threshold': 95,   # Seuil critique pour l'utilisation de la mémoire (%)
    'alert_emails': [],         # Liste des emails pour les alertes
    'smtp_server': 'smtp.gmail.com',  # Serveur SMTP pour l'envoi d'emails
    'smtp_port': 587,                 # Port SMTP
    'smtp_user': 'votre-email@gmail.com',  # Utilisateur SMTP
    'smtp_password': 'votre-mot-de-passe',  # Mot de passe SMTP
    'from_email': 'monitoring@votredomaine.com',  # Email expéditeur
}

# Charger la configuration à partir d'un fichier JSON
def load_config(config_file='redis_monitor_config.json'):
    """Charge la configuration depuis un fichier JSON."""
    config = DEFAULT_CONFIG.copy()
    try:
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config.update(json.load(f))
        else:
            # Créer un fichier de configuration par défaut s'il n'existe pas
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=4)
            print(f"Fichier de configuration créé : {config_file}")
            print("Veuillez configurer les paramètres avant de relancer le script.")
            sys.exit(0)
    except Exception as e:
        print(f"Erreur lors du chargement de la configuration : {e}")
        sys.exit(1)
    
    # Surcharger avec les variables d'environnement si elles existent
    for key in config:
        env_key = f"REDIS_MONITOR_{key.upper()}"
        if env_key in os.environ:
            # Convertir les types de base
            if isinstance(config[key], bool):
                config[key] = os.environ[env_key].lower() in ('true', '1', 't')
            elif isinstance(config[key], int):
                try:
                    config[key] = int(os.environ[env_key])
                except (ValueError, TypeError):
                    pass
            elif isinstance(config[key], float):
                try:
                    config[key] = float(os.environ[env_key])
                except (ValueError, TypeError):
                    pass
            else:
                config[key] = os.environ[env_key]
    
    return config

def connect_redis(config):
    """Établit une connexion à Redis."""
    try:
        r = redis.Redis(
            host=config['redis_host'],
            port=config['redis_port'],
            password=config['redis_password'] or None,
            db=config['redis_db'],
            socket_timeout=5,
            socket_connect_timeout=5,
            decode_responses=True
        )
        # Tester la connexion
        r.ping()
        return r
    except redis.RedisError as e:
        print(f"Erreur de connexion à Redis : {e}")
        return None

def get_redis_info(redis_conn):
    """Récupère les informations de Redis."""
    try:
        return redis_conn.info()
    except redis.RedisError as e:
        print(f"Erreur lors de la récupération des informations Redis : {e}")
        return None

def check_memory_usage(info, config):
    """Vérifie l'utilisation de la mémoire et retourne le statut."""
    if not info or 'used_memory' not in info or 'maxmemory' not in info:
        return 'UNKNOWN', 'Impossible de déterminer l\'utilisation de la mémoire.'
    
    if info['maxmemory'] == 0:
        return 'OK', 'Aucune limite de mémoire définie.'
    
    memory_usage = (info['used_memory'] / info['maxmemory']) * 100
    
    if memory_usage >= config['critical_threshold']:
        return 'CRITICAL', f'Utilisation de la mémoire critique : {memory_usage:.2f}%'
    elif memory_usage >= config['warning_threshold']:
        return 'WARNING', f'Utilisation de la mémoire élevée : {memory_usage:.2f}%'
    else:
        return 'OK', f'Utilisation de la mémoire normale : {memory_usage:.2f}%'

def check_connected_clients(info, config):
    """Vérifie le nombre de clients connectés."""
    if not info or 'connected_clients' not in info:
        return 'UNKNOWN', 'Impossible de déterminer le nombre de clients connectés.'
    
    # Vous pouvez ajouter des seuils personnalisés ici si nécessaire
    clients = info['connected_clients']
    return 'OK', f'Clients connectés : {clients}'

def check_replication(info, config):
    """Vérifie l'état de la réplication si configuré."""
    if not info or 'role' not in info:
        return 'UNKNOWN', 'Impossible de déterminer le rôle de réplication.'
    
    role = info['role']
    
    if role == 'master':
        # Vérifier les répliques connectées
        connected_slaves = info.get('connected_slaves', 0)
        if connected_slaves == 0:
            return 'WARNING', 'Aucune réplique connectée au maître.'
        return 'OK', f'Rôle : maître avec {connected_slaves} réplique(s) connectée(s).'
    elif role == 'slave':
        # Vérifier l'état de la réplication
        master_link_status = info.get('master_link_status', 'down')
        if master_link_status != 'up':
            return 'CRITICAL', f'La réplication est en panne (statut : {master_link_status}).'
        return 'OK', 'Rôle : réplique, synchronisé avec le maître.'
    else:
        return 'UNKNOWN', f'Rôle inconnu : {role}'

def send_alert(subject, message, config):
    """Envoie une alerte par email."""
    if not config.get('alert_emails'):
        print("Aucun email d'alerte configuré.")
        return False
    
    try:
        # Créer le message
        msg = MIMEText(message, 'plain', 'utf-8')
        msg['Subject'] = f"[ALERTE REDIS] {subject}"
        msg['From'] = config['from_email']
        msg['To'] = ', '.join(config['alert_emails'])
        
        # Envoyer l'email
        with smtplib.SMTP(config['smtp_server'], config['smtp_port']) as server:
            server.starttls()
            server.login(config['smtp_user'], config['smtp_password'])
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'alerte : {e}")
        return False

def generate_report(checks, config):
    """Génère un rapport de statut."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    status = 'OK'
    
    # Déterminer le statut global
    for check in checks.values():
        if check['status'] == 'CRITICAL':
            status = 'CRITICAL'
            break
        elif check['status'] == 'WARNING' and status != 'CRITICAL':
            status = 'WARNING'
    
    # Générer le rapport
    report = [
        f"=== Rapport de surveillance Redis - {timestamp} ===",
        f"Hôte : {config['redis_host']}:{config['redis_port']}",
        f"Statut global : {status}\n"
    ]
    
    # Ajouter les résultats des vérifications
    for name, result in checks.items():
        report.append(f"[{result['status']}] {name}: {result['message']}")
    
    return '\n'.join(report), status

def main():
    # Parser les arguments de ligne de commande
    parser = argparse.ArgumentParser(description='Surveillance de Redis pour LOQT')
    parser.add_argument('--config', '-c', default='redis_monitor_config.json',
                      help='Fichier de configuration JSON')
    parser.add_argument('--no-email', action='store_true',
                      help='Désactive l\'envoi d\'emails')
    args = parser.parse_args()
    
    # Charger la configuration
    config = load_config(args.config)
    
    # Se connecter à Redis
    redis_conn = connect_redis(config)
    if not redis_conn:
        print("Impossible de se connecter à Redis. Vérifiez la configuration.")
        sys.exit(2)
    
    # Récupérer les informations Redis
    info = get_redis_info(redis_conn)
    
    # Effectuer les vérifications
    checks = {
        'Mémoire': check_memory_usage(info, config),
        'Clients': check_connected_clients(info, config),
        'Réplication': check_replication(info, config),
    }
    
    # Convertir en format standardisé
    checks = {k: {'status': v[0], 'message': v[1]} for k, v in checks.items()}
    
    # Générer le rapport
    report, global_status = generate_report(checks, config)
    print(report)
    
    # Envoyer une alerte si nécessaire
    if not args.no_email and global_status in ('WARNING', 'CRITICAL'):
        send_alert(
            f"Statut {global_status} détecté sur Redis",
            report,
            config
        )
    
    # Code de sortie approprié
    if global_status == 'CRITICAL':
        sys.exit(2)
    elif global_status == 'WARNING':
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
