# Crée un nom de fichier de sauvegarde avec la date et l'heure actuelles
BACKUP_FILE="sauvegarde_$(date +%Y%m%d_%H%M%S).sql"

# Exécute la commande pg_dump pour exporter la base de données Loqt
# dans un fichier SQL, en s'authentifiant avec l'utilisateur postgres
docker compose exec db pg_dump -U postgres loqt > "$BACKUP_FILE"

# Définit les répertoires à sauvegarder
DIRECTORIES_TO_BACKUP=(
    "/c/Users/Utilisateur/Desktop/projects/loqt/loqt"
)

# Crée un fichier tar.gz contenant les répertoires à sauvegarder
tar -czvf "$BACKUP_FILE" "${DIRECTORIES_TO_BACKUP[@]}"

# Affiche un message pour indiquer que la sauvegarde a été créée
echo "Sauvegarde créée : $BACKUP_FILE"
