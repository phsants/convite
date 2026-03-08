# ========== Stage 1: build do frontend (Vite + React) ==========
FROM node:20-alpine AS frontend
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY index.html vite.config.js ./
COPY src ./src

# Build com URL da API relativa (mesmo servidor em produção)
ENV VITE_API_URL=
RUN npm run build

# ========== Stage 2: API Node + frontend servido junto ==========
FROM node:20-alpine
WORKDIR /app

# Só dependências do server
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev

# Código do server
COPY server/ .
# Frontend buildado (estático)
COPY --from=frontend /app/dist ./dist

# Pasta de uploads (fotos); em produção pode usar volume
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV DIST_PATH=/app/dist

EXPOSE 3000

CMD ["node", "index.js"]
