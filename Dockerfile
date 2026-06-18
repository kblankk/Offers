# Imagem para rodar o AllCupom (Next.js) em qualquer host com Docker
# (Render, Fly.io, Railway, VPS...). Leve: sem navegador — a coleta usa fetch.
FROM node:22-bookworm-slim

WORKDIR /app

# Dependencias primeiro (cache de camadas)
COPY package.json package-lock.json ./
RUN npm ci

# Codigo e build
COPY . .
# Build "magro" para caber na RAM do plano free (512MB):
# - telemetria off; - limita o heap do V8 para o GC agir antes do limite do container.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=448
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV COLLECT_INTERVAL_MIN=5
EXPOSE 3000

CMD ["npm", "run", "start"]
