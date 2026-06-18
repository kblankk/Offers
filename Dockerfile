# Imagem para rodar o Cupom Radar (Next.js + Playwright) em qualquer host
# que aceite Docker (Render, Fly.io, Railway, VPS...).
FROM node:22-bookworm-slim

WORKDIR /app

# Dependencias primeiro (cache de camadas)
COPY package.json package-lock.json ./
# Evita baixar o Chromium duas vezes no postinstall; instalamos com --with-deps abaixo.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci

# Chromium + bibliotecas de sistema para o Playwright
RUN npx playwright install --with-deps chromium

# Codigo e build
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV COLLECT_INTERVAL_MIN=5
EXPOSE 3000

CMD ["npm", "run", "start"]
