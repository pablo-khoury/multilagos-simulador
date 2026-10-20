FROM node:20-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Habilita o Yarn de forma nativa e instala as dependências sem os bugs do npm
RUN corepack enable && corepack prepare yarn@stable --activate
RUN yarn install

# Copia o restante do código e compila o projeto
COPY . .
RUN yarn build

# Estágio final com Nginx para servir a aplicação
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]