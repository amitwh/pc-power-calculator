# syntax=docker/dockerfile:1.7
# PC Power Calculator — single-stage build for Coolify.
#
# This used to be node-build → nginx-serve with `COPY --from=build`. That cannot
# build on the current host: its BuildKit fails to resolve ANY
# `COPY --from=<stage>` with "archive/tar: invalid tar header" (reproducible
# with a two-line Dockerfile holding one `hello` file), and clearing the builder
# cache does not fix it. Building and serving from one image avoids the broken
# operation. It costs image size, not correctness — revert to two stages once
# the host builder is repaired (restarting dockerd clears it).

FROM node:22-slim

# nginx serves the prerendered output; the toolchain covers Vite/rolldown native
# deps and scripts/prerender.mjs.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      nginx python3 build-essential ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && rm -f /etc/nginx/sites-enabled/default

WORKDIR /app

# Install JS deps — --include=optional pulls in the platform-specific
# @rolldown/binding-* native module that Vite 8 requires.
COPY package.json package-lock.json ./
RUN npm ci --include=optional --no-audit --no-fund

# Copy source and build. Tailwind 4 is configured from CSS (@theme in
# src/styles/tokens.css), so there is no tailwind.config.js or PostCSS config.
COPY tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY public/ ./public/
COPY src/ ./src/
# scripts/prerender.mjs runs as the last step of `npm run build`; without it
# the build fails with MODULE_NOT_FOUND inside the image.
COPY scripts/ ./scripts/
# Assert dist/index.html exists so a silent vite failure can never ship an
# empty image; dist-ssr is only an intermediate for the prerender step.
RUN npm run build \
 && rm -rf dist-ssr \
 && test -f dist/index.html \
 && rm -rf /usr/share/nginx/html/* \
 && cp -r dist/. /usr/share/nginx/html/

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# node's fetch is the only HTTP client guaranteed present in this image.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["nginx", "-g", "daemon off;"]
