# ── Étape 1 : Builder ────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
# La variable VITE_API_URL doit être passée en build-arg si nécessaire, 
# ou on utilise un chemin relatif dans le frontend (ex: /api/)
RUN npm run build

# ── Étape 2 : Nginx ──────────────────────────────────────────────────────────
FROM nginx:alpine

# Copier la configuration Nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copier le frontend compilé
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
