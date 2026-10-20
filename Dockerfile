# Estágio de Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia apenas os arquivos de dependência primeiro para aproveitar o cache
COPY package.json ./

# Removemos qualquer dependência de lockfile problemático e forçamos uma instalação limpa
RUN npm install --legacy-peer-deps

# Copia o restante do código-fonte
COPY . .

# Se o seu projeto for um app frontend (como Vite/React), descomente a linha abaixo para compilar:
# RUN npm run build

# Estágio de Produção com Nginx
FROM nginx:alpine

# Copia os arquivos gerados (ajuste o caminho de build se necessário, ex: /app/dist para /usr/share/nginx/html)
COPY --from=builder /app /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]