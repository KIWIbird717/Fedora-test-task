# syntax=docker/dockerfile:1
# Context is the repository root (see docker-compose.yml / nx docker:build).
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS build
ENV NX_DAEMON=false
RUN pnpm nx build web

FROM nginxinc/nginx-unprivileged:alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
