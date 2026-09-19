# syntax=docker/dockerfile:1
# Context is the repository root (see docker-compose.yml / nx docker:build).
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS build
ENV NX_DAEMON=false
RUN pnpm nx prune api

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate \
  && addgroup -S app && adduser -S app -G app
COPY --from=build /app/apps/api/dist/ ./
RUN pnpm install --frozen-lockfile --prod \
  && chown -R app:app /app
USER app
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "main.js"]
