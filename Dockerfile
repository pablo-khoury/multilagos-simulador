# -------------------------------------------------------------
# Dockerfile Multi-stage para Produção no Easypanel / VPS Hostinger
# -------------------------------------------------------------

# Estágio 1: Build da aplicação React + Vite
FROM node:20-alpine AS builder

WORKDIR /app

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
