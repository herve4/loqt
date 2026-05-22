# ── Étape 1 : Builder Frontend ─────────────────────────────────────────────
FROM node:18-alpine AS frontend-builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ .
# Construction du build de production (les fichiers iront dans /app/dist)
# VITE_API_URL est nécessaire si le frontend pointe vers un chemin absolu, 
# mais ici il pointe vers la même origine si on ne précise rien, ou on peut le passer en build-arg
ENV VITE_API_URL=/api/
RUN npm run build

# ── Étape 2 : Nginx ──────────────────────────────────────────────────────────
FROM nginx:alpine

# Copier la configuration Nginx
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copier le frontend compilé depuis l'étape builder
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
