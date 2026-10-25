# -------------------------------------------------------------
# Dockerfile Multi-stage para Produção no Easypanel / VPS Hostinger
# -------------------------------------------------------------

# Estágio 1: Build da aplicação React + Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Variáveis de ambiente opcionais injetadas pelo Easypanel no momento do build
ARG VITE_FIREBASE_API_KEY=""
ARG VITE_FIREBASE_AUTH_DOMAIN=""
ARG VITE_FIREBASE_PROJECT_ID=""
ARG VITE_FIREBASE_STORAGE_BUCKET=""
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=""
ARG VITE_FIREBASE_APP_ID=""
ARG VITE_FIREBASE_OAUTH_CLIENT_ID=""
ARG VITE_GOOGLE_WEBHOOK_URL=""

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_OAUTH_CLIENT_ID=$VITE_FIREBASE_OAUTH_CLIENT_ID
ENV VITE_GOOGLE_WEBHOOK_URL=$VITE_GOOGLE_WEBHOOK_URL

# Copia dependências e instala
COPY package*.json ./
RUN npm install

# Copia código-fonte e compila
COPY . .
RUN npm run build

# Estágio 2: Servidor Web Nginx ultra-leve
FROM nginx:alpine

# Copia build estático
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configuração do Nginx com suporte a SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
