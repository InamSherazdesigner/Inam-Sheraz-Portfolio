# =============================================================================
# BACKEND IMAGE
#
# Multi-stage so the shipped layer carries production dependencies only — no
# compilers, no test tooling, nothing an attacker could pivot through.
# =============================================================================

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
# omit=dev leaves vitest, eslint and their transitive trees out of the image.
RUN npm ci --omit=dev --workspace @portfolio/backend --include-workspace-root

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Trims the default 64MB-per-thread arena; this service is I/O bound and does
# not need it.
ENV UV_THREADPOOL_SIZE=8

# The base image ships an unprivileged `node` user. Running as root inside a
# container turns a code-execution bug into a container-escape attempt.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node backend/package.json ./package.json
COPY --chown=node:node backend/src ./src
COPY --chown=node:node backend/scripts ./scripts

USER node
EXPOSE 4000

# Uses the liveness endpoint specifically — readiness returns 200 while
# degraded, so healthchecking it would still be correct, but liveness is the
# cheaper question and the right one for "should this container be restarted".
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# node directly, no npm wrapper: npm swallows SIGTERM, which would break the
# graceful shutdown in server.js on every deploy.
CMD ["node", "src/server.js"]
