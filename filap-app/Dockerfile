# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (leverage layer caching)
COPY package*.json ./

# Install production-only deps
RUN npm ci

# Copy source and build arguments
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# ---------- Production stage ----------
FROM node:20-alpine AS production

WORKDIR /app

# Install a lightweight static-file server
RUN npm install -g serve

# Create non-root user/group
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built assets and fix ownership
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist

USER nextjs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=5s \
            --retries=3 \
            CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start serving the static files
CMD ["serve", "-s", "dist", "-p", "3000"]