# Etapa 1: construir a aplicação
FROM node:18 AS builder

WORKDIR /app

# Copia e instala as dependências
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Compila o TypeScript
RUN npm run build

# Etapa 2: imagem final apenas com o que precisa para rodar
FROM node:18

WORKDIR /app

# Copia apenas os arquivos necessários da build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Define o comando que inicia a aplicação
CMD ["node", "dist/index.js"]
