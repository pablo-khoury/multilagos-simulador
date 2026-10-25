# -------------------------------------------------------------
# Dockerfile Multi-stage para Produção no Easypanel / VPS
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

# Copia apenas o package.json para evitar bugs do package-lock corrompido
COPY package.json ./

# Remove qualquer lockfile antigo que possa estar corrompido e força instalação limpa
RUN rm -f package-lock.json && npm install --legacy-peer-deps

# Copia o restante do código-fonte
COPY . .

# Compila o projeto gerando a pasta /app/dist
RUN npm run build

# Estágio 2: Servidor Web Nginx ultra-leve para servir a SPA
FROM nginx:alpine

# Copia os arquivos estáticos compilados do estágio de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a configuração customizada do Nginx com suporte a SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]