# Stage 1: Build Angular app (Tailwind lives in devDependencies)
FROM node:22.14.0 AS builder
WORKDIR /app

# Do NOT use NODE_ENV=production here — that skips tailwindcss/postcss/autoprefixer
ENV NPM_CONFIG_PRODUCTION=false
ENV NODE_ENV=development

COPY package*.json ./
COPY tailwind.config.js postcss.config.js ./
RUN npm install --legacy-peer-deps

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
