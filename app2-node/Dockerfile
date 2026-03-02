FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./

RUN npm install --omit=dev

COPY --chown=appuser:appgroup server.js .

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]