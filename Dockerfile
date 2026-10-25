# Estágio de Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instalação limpa
RUN npm install --legacy-peer-deps

# Copia o restante do código-fonte
COPY . .

# Compila o projeto (gerando a pasta dist otimizada para produção)
RUN npm run build

# Estágio de Produção com Nginx
FROM nginx:alpine

# Copia apenas os arquivos compilados da pasta dist para o NGINX
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]