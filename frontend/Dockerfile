FROM node:18-alpine AS base

# Install jq for JSON manipulation
RUN apk add --no-cache jq

# Enable corepack for npm version management
RUN corepack enable

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy root package.json and lockfile
COPY package.json package-lock.json* ./

# Store original package.json with packageManager field for the builder stage
RUN cp package.json package.json.original

# Remove packageManager field from package.json to avoid issues with yarn/npm conflict during installation
RUN cat package.json | jq 'del(.packageManager)' > package.json.tmp && mv package.json.tmp package.json

# Copy workspace configs
COPY turbo.json ./
COPY .npmrc ./

# Create directories for all workspaces
RUN mkdir -p apps/tenant-management apps/admin-portal packages/ui packages/api-client packages/eslint-config packages/typescript-config

# Copy all package.json files from workspaces
COPY apps/tenant-management/package.json ./apps/tenant-management/
COPY apps/admin-portal/package.json ./apps/admin-portal/
COPY packages/ui/package.json ./packages/ui/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies using npm with workspace support
RUN npm install --workspaces --include-workspace-root --no-package-lock

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json.original ./package.json
COPY . .

# Set environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Set verbose logging for better debugging
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_LOG_VERBOSITY="info"
ENV NODE_ENV="production"

# Only remove packageManager from workspace package.json files, but keep it in the root package.json for Turborepo
RUN find ./apps ./packages -name "package.json" -type f -exec sh -c 'cat {} | jq "del(.packageManager)" > {}.tmp && mv {}.tmp {}' \;

# Build both apps with detailed logs
RUN npx turbo build --filter=tenant-management --filter=admin-portal --dry=false --no-daemon --output-logs=full --summarize

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy built applications
COPY --from=builder --chown=nextjs:nodejs /app/apps/tenant-management/.next ./apps/tenant-management/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/tenant-management/public ./apps/tenant-management/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/tenant-management/package.json ./apps/tenant-management/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/tenant-management/next.config.js ./apps/tenant-management/next.config.js

COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-portal/.next ./apps/admin-portal/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-portal/public ./apps/admin-portal/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-portal/package.json ./apps/admin-portal/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-portal/next.config.js ./apps/admin-portal/next.config.js

# Copy necessary files for the monorepo setup
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/turbo.json ./turbo.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Start command - adjust according to which app should run
# For deployment, we're setting up to run the tenant-management app
EXPOSE 3000
CMD ["npm", "run", "--workspace=tenant-management", "start"]
