FROM node:20-alpine

# Define o ambiente como produção
ENV NODE_ENV=production

WORKDIR /app

# Criação do usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copia arquivos de definição de pacote
COPY package*.json ./

# Substituímos o npm ci pelo npm install para não depender do package-lock.json
RUN npm install --omit=dev

# Copia o código já aplicando as permissões corretas
COPY --chown=appuser:appgroup server.js .

# Alterna para o usuário restrito
USER appuser

EXPOSE 3000

CMD ["node", "server.js"]