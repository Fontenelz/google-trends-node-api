# -------- Stage 1: Builder --------
FROM node:20-alpine AS builder

# Instala dependências necessárias também no builder (caso Puppeteer rode em build/testes)
RUN apk add --no-cache \
  redis \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build


# -------- Stage 2: Final --------
FROM node:20-alpine

# Instala apenas runtime necessário pro Puppeteer/Chromium
RUN apk add --no-cache \
  redis \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copia apenas dist e dependências
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Copia o script para o container
COPY start.sh ./

# Dá permissão de execução no build
RUN chmod +x start.sh

EXPOSE 3000 6379
CMD ["node", "dist/index.js"]
