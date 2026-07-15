# GuavaJobs API — production image for Coolify (Hetzner VPS)
#
# Single container runs the HTTP API and BullMQ processors together
# (see src/config/workers.ts). No serverless adapter — this is a
# long-running Node process, matched to Coolify's deploy model.
#
# Coolify often injects NODE_ENV=production as a build-time ARG. That makes
# `npm ci` skip devDependencies (@nestjs/cli, prisma CLI, typescript), which
# breaks `nest build`. Force including devDependencies during the builder stage.

FROM node:20-slim AS builder
WORKDIR /app

# Install openssl before `prisma generate` so it detects the right engine
# (must match the runtime stage's openssl, or the query engine fails to load).
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# --include=dev overrides NODE_ENV=production from Coolify build-time args
RUN npm ci --include=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build \
  && npm prune --omit=dev

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Prisma's query engine needs openssl on Debian slim images.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# prisma migrate deploy is run as a separate one-off Coolify command,
# not on every container start — keeps deploys fast and avoids races
# when Coolify scales the app to multiple replicas later.
EXPOSE 3000
CMD ["node", "dist/main.js"]
