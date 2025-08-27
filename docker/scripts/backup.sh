#!/bin/bash
set -e

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Créer le dossier de sauvegarde s'il n'existe pas
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Générer un nom de fichier avec la date et l'heure actuelle
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
BACKUP_ZIP="$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"

# Sauvegarde de la base de données PostgreSQL
echo "Création de la sauvegarde de la base de données..."
docker-compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"

# Vérifier que la sauvegarde a réussi
if [ $? -eq 0 ]; then
    echo "Sauvegarde de la base de données terminée : $BACKUP_FILE"
else
    echo "Erreur lors de la sauvegarde de la base de données"
    exit 1
fi

# Sauvegarde des médias et des fichiers importants
echo "Création de l'archive de sauvegarde..."
tar -czf "$BACKUP_ZIP" "$BACKUP_FILE" ./media .env

# Supprimer le dump SQL temporaire
rm "$BACKUP_FILE"

# Vérifier que l'archive a été créée
if [ -f "$BACKUP_ZIP" ]; then
    # Calculer la taille de l'archive
    FILESIZE=$(du -h "$BACKUP_ZIP" | cut -f1)
    
    echo "Sauvegarde terminée avec succès !"
    echo "Fichier : $BACKUP_ZIP"
    echo "Taille : $FILESIZE"
    
    # Supprimer les sauvegardes de plus de 7 jours
    echo "Nettoyage des anciennes sauvegardes..."
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +7 -delete -print
    
    echo "Sauvegarde terminée avec succès !"
else
    echo "Erreur lors de la création de l'archive de sauvegarde"
    exit 1
fi
