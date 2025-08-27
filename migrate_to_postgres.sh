#!/bin/bash
set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages d'information
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Fonction pour afficher les avertissements
warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Fonction pour afficher les erreurs et quitter
error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Vérifier que docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    error "docker-compose n'est pas installé. Veuillez l'installer avant de continuer."
fi

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    warning "Le fichier .env n'existe pas. Création à partir de .env.example..."
    cp .env.example .env
    
    # Demander les informations de configuration
    echo -e "\nConfiguration de la base de données PostgreSQL :"
    read -p "Nom de la base de données [loqt]: " DB_NAME
    DB_NAME=${DB_NAME:-loqt}
    
    read -p "Utilisateur PostgreSQL [loqt]: " DB_USER
    DB_USER=${DB_USER:-loqt}
    
    read -sp "Mot de passe PostgreSQL: " DB_PASSWORD
    echo ""
    
    # Mettre à jour le fichier .env
    sed -i "s/POSTGRES_DB=.*/POSTGRES_DB=$DB_NAME/" .env
    sed -i "s/POSTGRES_USER=.*/POSTGRES_USER=$DB_USER/" .env
    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD='$DB_PASSWORD'"'!'"'/' .env
    
    # Générer une clé secrète sécurisée
    SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
    sed -i "s/SECRET_KEY=.*/SECRET_KEY='$SECRET_KEY'"'!'"'/' .env
    
    info "Fichier .env configuré avec succès."
fi

# Charger les variables d'environnement
export $(grep -v '^#' .env | xargs)

# Étape 1: Sauvegarder les données actuelles
info "1/4 - Sauvegarde des données actuelles depuis SQLite..."
if [ -f db.sqlite3 ]; then
    python manage.py dumpdata --exclude=contenttypes --exclude=auth.permission --exclude=admin.logentry --indent 2 > datadump.json
    
    if [ $? -eq 0 ]; then
        info "Sauvegarde réussie dans datadump.json"
    else
        error "Échec de la sauvegarde des données."
    fi
else
    warning "Le fichier db.sqlite3 n'existe pas. Aucune donnée à sauvegarder."
fi

# Étape 2: Mettre à jour settings.py
info "2/4 - Mise à jour de la configuration de la base de données..."

# Créer une sauvegarde de settings.py
cp loqt/settings.py loqt/settings.py.backup

# Mettre à jour la configuration de la base de données
cat > loqt/settings.py.new << 'EOL'
# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'loqt'),
        'USER': os.getenv('POSTGRES_USER', 'loqt'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', ''),
        'HOST': os.getenv('POSTGRES_HOST', 'db'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
    }
}
EOL

# Insérer la nouvelle configuration après les imports
grep -B 1000 "^# Database" loqt/settings.py | grep -v "^# Database" > loqt/settings.py.temp
cat loqt/settings.py.new >> loqt/settings.py.temp
tail -n +$(grep -n "^# Database" loqt/settings.py | cut -d: -f1) loqt/settings.py | tail -n +2 >> loqt/settings.py.temp
mv loqt/settings.py.temp loqt/settings.py
rm loqt/settings.py.new

info "Configuration de la base de données mise à jour avec succès."

# Étape 3: Démarrer les services PostgreSQL
info "3/4 - Démarrage des services PostgreSQL..."
docker-compose up -d db

# Attendre que PostgreSQL soit prêt
info "Attente du démarrage de PostgreSQL..."
until docker-compose exec db pg_isready -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; do
    sleep 2
done

# Étape 4: Appliquer les migrations et importer les données
info "4/4 - Application des migrations et importation des données..."

docker-compose run --rm web python manage.py migrate --noinput

if [ -f datadump.json ]; then
    info "Importation des données..."
    docker-compose run --rm web python manage.py loaddata datadump.json
    
    if [ $? -eq 0 ]; then
        info "Données importées avec succès."
        # Créer un superutilisateur si nécessaire
        docker-compose run --rm web python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print('Superutilisateur créé avec succès (admin/admin)')
else:
    print('Un superutilisateur existe déjà')"
    else
        warning "Échec de l'importation des données. Vérifiez les erreurs ci-dessus."
    fi
else
    warning "Aucun fichier de données à importer."
fi

# Démarrer tous les services
info "Démarrage de tous les services..."
docker-compose up -d

# Vérifier que tout fonctionne
info "Vérification de l'installation..."
if curl -s http://localhost:8000/admin/ > /dev/null; then
    echo -e "${GREEN}Migration réussie !${NC}"
    echo "- Application : http://localhost:8000"
    echo "- Admin : http://localhost:8000/admin/"
    echo "  - Identifiants : admin / admin"
else
    warning "L'application ne semble pas démarrer correctement. Vérifiez les logs avec : docker-compose logs"
fi

echo -e "\n${GREEN}Migration terminée avec succès !${NC}"
