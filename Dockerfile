# Image de base pour l'environnement de build
FROM python:3.13-slim AS builder

# Répertoire de travail pour l'environnement de build
WORKDIR /app

# Variables d'environnement pour l'environnement de build
ENV PYTHONDONTWRITEBYTECODE=1 
#Ne pas écrire de fichiers bytecode
ENV PYTHONUNBUFFERED=1 
#Ne pas mettre en tampon les sorties

# Mettre à jour pip
RUN pip install --upgrade pip

# Copier les dépendances du projet
COPY requirements.txt .

# Installer les dépendances du projet
RUN pip install --no-cache-dir -r requirements.txt

# Image de base pour l'environnement d'exécution
FROM python:3.13-slim

# Créer un utilisateur loqt et un répertoire /app
RUN useradd -m loqt && \
    mkdir /app && \
    chown -R loqt:loqt /app

# Copier les bibliothèques installées dans l'environnement de build
COPY --from=builder /usr/local/lib/python3.13/site-packages/ /usr/local/lib/python3.13/site-packages/
# Copier les exécutables installés dans l'environnement de build
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Répertoire de travail pour l'environnement d'exécution
WORKDIR /app

# Créer les répertoires nécessaires
RUN mkdir -p /static /media && \
    chown -R loqt:loqt /static /media /app

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier le fichier requirements.txt pour le cache Docker
COPY requirements.txt .

# Installer les dépendances du projet
RUN pip install --no-cache-dir -r requirements.txt

# Copier tout le contenu du projet
COPY . .

# S'assurer que les scripts sont exécutables
RUN chmod +x manage.py wait-for-db.sh

# Variables d'environnement pour l'environnement d'exécution
ENV PYTHONDONTWRITEBYTECODE=1 
# Ne pas écrire de fichiers bytecode
ENV PYTHONUNBUFFERED=1 
# Ne pas mettre en tampon les sorties

# Changer l'utilisateur courant en loqt
USER loqt

# Exposer le port 8000
EXPOSE 8000

# Commande par défaut pour lancer l'application
CMD ["bash", "-c", "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 --access-logfile - --error-logfile - --log-level debug loqt.wsgi:application"]

