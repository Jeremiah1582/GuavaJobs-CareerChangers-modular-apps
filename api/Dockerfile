# GuavaJobs API — production image for Coolify (Hetzner VPS)
#
# Single container runs the HTTP API and BullMQ processors together
# (see src/config/workers.ts). No serverless adapter — this is a
# long-running Node process, matched to Coolify's deploy model.

FROM node:20-slim AS builder
WORKDIR /app

# Install openssl before `prisma generate` so it detects the right engine
# (must match the runtime stage's openssl, or the query engine fails to load).
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

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
