@echo off
setlocal enabledelayedexpansion

:: Couleurs
set "GREEN=[32m"
set "YELLOW=[33m"
set "RED=[31m"
set "NC=[0m"

:: Vérifier que docker-compose est disponible
docker-compose --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%[ERREUR] docker-compose n'est pas installé ou n'est pas dans le PATH.%NC%
    exit /b 1
)

:: Vérifier que le fichier .env existe
if not exist .env (
    echo %YELLOW%Le fichier .env n'existe pas. Création à partir de .env.example...%NC%
    copy /Y .env.example .env >nul
    
    :: Demander les informations de configuration
    echo.
    echo Configuration de la base de données PostgreSQL :
    set /p DB_NAME=Nom de la base de données [loqt]: 
    if "!DB_NAME!"=="" set DB_NAME=loqt
    
    set /p DB_USER=Utilisateur PostgreSQL [loqt]: 
    if "!DB_USER!"=="" set DB_USER=loqt
    
    set /p "DB_PASSWORD=Mot de passe PostgreSQL: "
    
    :: Mettre à jour le fichier .env
    powershell -Command "(Get-Content .env) -replace 'POSTGRES_DB=.*', 'POSTGRES_DB=!DB_NAME!' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'POSTGRES_USER=.*', 'POSTGRES_USER=!DB_USER!' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'POSTGRES_PASSWORD=.*', 'POSTGRES_PASSWORD=!DB_PASSWORD!' | Set-Content .env"
    
    :: Générer une clé secrète sécurisée
    for /f %%a in ('python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"') do set "SECRET_KEY=%%a"
    powershell -Command "(Get-Content .env) -replace 'SECRET_KEY=.*', 'SECRET_KEY=!SECRET_KEY!' | Set-Content .env"
    
    echo %GREEN%Fichier .env configuré avec succès.%NC%
)

:: Charger les variables d'environnement
for /f "usebackq tokens=*" %%i in (`.env") do set "%%i"

:: Étape 1: Sauvegarder les données actuelles
echo %GREEN%1/4 - Sauvegarde des données actuelles depuis SQLite...%NC%
if exist db.sqlite3 (
    python manage.py dumpdata --exclude=contenttypes --exclude=auth.permission --exclude=admin.logentry --indent 2 > datadump.json
    
    if %ERRORLEVEL% equ 0 (
        echo %GREEN%Sauvegarde réussie dans datadump.json%NC%
    ) else (
        echo %RED%Échec de la sauvegarde des données.%NC%
        exit /b 1
    )
) else (
    echo %YELLOW%Le fichier db.sqlite3 n'existe pas. Aucune donnée à sauvegarder.%NC%
)

:: Étape 2: Mettre à jour settings.py
echo %GREEN%2/4 - Mise à jour de la configuration de la base de données...%NC%

:: Créer une sauvegarde de settings.py
copy /Y loqt\settings.py loqt\settings.py.backup >nul

:: Créer un fichier temporaire avec la nouvelle configuration
echo # Database configuration> settings_new.txt
echo DATABASES = {>> settings_new.txt
echo     'default': {>> settings_new.txt
echo         'ENGINE': 'django.db.backends.postgresql',>> settings_new.txt
echo         'NAME': os.getenv('POSTGRES_DB', 'loqt'),>> settings_new.txt
echo         'USER': os.getenv('POSTGRES_USER', 'loqt'),>> settings_new.txt
echo         'PASSWORD': os.getenv('POSTGRES_PASSWORD', ''),>> settings_new.txt
echo         'HOST': os.getenv('POSTGRES_HOST', 'db'),>> settings_new.txt
echo         'PORT': os.getenv('POSTGRES_PORT', '5432'),>> settings_new.txt
echo     }>> settings_new.txt
echo }>> settings_new.txt

:: Insérer la nouvelle configuration après les imports
powershell -Command "$content = Get-Content 'loqt\settings.py' -Raw; $dbConfig = Get-Content 'settings_new.txt' -Raw; $content -replace '(?s)(# Database\s+).*?(?=\n\w)', ('$1' + $dbConfig) | Set-Content 'loqt\settings.py'"
del settings_new.txt

echo %GREEN%Configuration de la base de données mise à jour avec succès.%NC%

:: Étape 3: Démarrer les services PostgreSQL
echo %GREEN%3/4 - Démarrage des services PostgreSQL...%NC%
docker-compose up -d db

:: Attendre que PostgreSQL soit prêt
echo %GREEN%Attente du démarrage de PostgreSQL...%NC%
:check_db
docker-compose exec -T db pg_isready -U %POSTGRES_USER% -d %POSTGRES_DB% >nul 2>&1
if %ERRORLEVEL% neq 0 (
    timeout /t 2 >nul
    goto check_db
)

:: Étape 4: Appliquer les migrations et importer les données
echo %GREEN%4/4 - Application des migrations et importation des données...%NC%

docker-compose run --rm web python manage.py migrate --noinput

if exist datadump.json (
    echo %GREEN%Importation des données...%NC%
    docker-compose run --rm web python manage.py loaddata datadump.json
    
    if %ERRORLEVEL% equ 0 (
        echo %GREEN%Données importées avec succès.%NC%
        
        :: Créer un superutilisateur si nécessaire
        docker-compose run --rm web python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print('Superutilisateur créé avec succès (admin/admin)')
else:
    print('Un superutilisateur existe déjà')"
    ) else (
        echo %YELLOW%Échec de l'importation des données. Vérifiez les erreurs ci-dessus.%NC%
    )
) else (
    echo %YELLOW%Aucun fichier de données à importer.%NC%
)

:: Démarrer tous les services
echo %GREEN%Démarrage de tous les services...%NC%
docker-compose up -d

:: Vérifier que tout fonctionne
echo %GREEN%Vérification de l'installation...%NC%
curl -s http://localhost:8000/admin/ >nul
if %ERRORLEVEL% equ 0 (
    echo %GREEN%Migration réussie !%NC%
    echo - Application : http://localhost:8000
    echo - Admin : http://localhost:8000/admin/
    echo   Identifiants : admin / admin
) else (
    echo %YELLOW%L'application ne semble pas démarrer correctement. Vérifiez les logs avec : docker-compose logs%NC%
)

echo.
echo %GREEN%Migration terminée avec succès !%NC%
