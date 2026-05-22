# Stage 1: Build Angular app (Tailwind lives in devDependencies)
FROM node:22.14.0 AS builder
WORKDIR /app

# Do NOT use NODE_ENV=production here — that skips tailwindcss/postcss/autoprefixer
ENV NPM_CONFIG_PRODUCTION=false
ENV NODE_ENV=development
# Reseau instable (Docker) : timeouts + retries npm
ENV NPM_CONFIG_FETCH_RETRIES=8
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000
ENV NPM_CONFIG_FETCH_TIMEOUT=600000
ENV NPM_CONFIG_MAXSOCKETS=3
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

COPY package*.json ./
COPY tailwind.config.js postcss.config.js ./
# 3 tentatives (ECONNRESET / proxy / Wi-Fi lent)
RUN set -e; \
  for i in 1 2 3; do \
    echo "=== npm install (tentative $i/3) ==="; \
    npm install --legacy-peer-deps && exit 0; \
    echo "=== echec npm, nouvelle tentative dans 15s ==="; \
    sleep 15; \
  done; \
  echo "ERREUR: npm install apres 3 tentatives"; exit 1

COPY . .
RUN npm run build

# Fail early if Tailwind did not generate a real global stylesheet
RUN sh -c '\
  CSS=$(ls /app/dist/find-me-frontend/browser/styles*.css 2>/dev/null | head -1); \
  if [ -z "$CSS" ]; then echo "ERROR: no styles*.css in build output"; exit 1; fi; \
  SIZE=$(wc -c < "$CSS"); \
  echo "Global CSS size: $SIZE bytes ($CSS)"; \
  if [ "$SIZE" -lt 20000 ]; then \
    echo "ERROR: CSS too small — Tailwind likely missing. Check tailwind.config.js in repo."; \
    exit 1; \
  fi'

# Stage 2: Serve with Nginx
FROM nginx:1.26-alpine AS production
COPY --from=builder /app/dist/find-me-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
