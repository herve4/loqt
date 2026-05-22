# ── Étape 1 : Builder — installe les dépendances ─────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN pip install --upgrade pip
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Étape 2 : Image d'exécution ───────────────────────────────────────────────
FROM python:3.13-slim

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier les packages Python depuis le builder
COPY --from=builder /usr/local/lib/python3.13/site-packages/ /usr/local/lib/python3.13/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Créer l'utilisateur loqt AVANT toute opération sur /app
RUN useradd -m loqt

# Répertoire de travail
WORKDIR /app

# Copier le code source (en tant que root — nécessaire pour COPY)
COPY . .

# Créer les dossiers de données et corriger TOUTES les permissions en une seule commande
# Fait APRÈS le COPY pour écraser les permissions Windows/root
RUN mkdir -p /app/staticfiles /app/media /app/static_dev /app/staticfiles && \
    chmod +x manage.py wait-for-db.sh && \
    chown -R loqt:loqt /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Basculer vers l'utilisateur non-root
USER loqt

EXPOSE 8000

# CMD de fallback (remplacé par docker-compose command)
CMD ["bash", "-c", "./wait-for-db.sh && python manage.py migrate --noinput && python manage.py collectstatic --noinput && exec gunicorn loqt.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120 --keep-alive 5 --worker-class sync --log-level info --access-logfile - --error-logfile -"]
