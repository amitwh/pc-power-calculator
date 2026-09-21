# syntax=docker/dockerfile:1.7
# PC Power Calculator — multi-stage build for Coolify
# Build with Vite (rolldown needs native bindings), serve with nginx.

# ---------- Build stage ----------
FROM node:22-slim AS build
WORKDIR /app

# Install OS build tools needed by some Vite/rolldown native deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 build-essential ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install JS deps — --include=optional pulls in the platform-specific
# @rolldown/binding-* native module that Vite 8 requires.
COPY package.json package-lock.json ./
RUN npm ci --include=optional --no-audit --no-fund

# Copy source and build
COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY public/ ./public/
COPY src/ ./src/
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]