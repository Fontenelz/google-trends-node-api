# 1️⃣ Stage de build
FROM node:18-slim AS build

# 2️⃣ Instala dependências do Chromium necessárias para Puppeteer
RUN apt-get update && apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
  libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  ca-certificates fonts-liberation libnss3 lsb-release xdg-utils wget \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# 3️⃣ Diretório de trabalho
WORKDIR /app

# 4️⃣ Copia só package.json e yarn.lock para aproveitar cache
COPY package.json yarn.lock ./

# 5️⃣ Instala dependências
RUN yarn install --frozen-lockfile

# 6️⃣ Copia o resto do código
COPY . .

# 7️⃣ Build do TypeScript
RUN yarn build

# =====================
# 2️⃣ Stage de produção (menor e mais leve)
# =====================
FROM node:18-slim

# 1️⃣ Instala só dependências necessárias pro Puppeteer
RUN apt-get update && apt-get install -y \
  ca-certificates fonts-liberation libnss3 \
  libatk1.0-0 libcups2 libx11-6 libxcomposite1 libxdamage1 libxrandr2 \
  libxss1 libxtst6 libxrender1 libglib2.0-0 libgtk-3-0 libdbus-1-3 \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2️⃣ Copia node_modules e build do stage anterior
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist .
