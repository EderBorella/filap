# Multi-stage build for optimal image size
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install serve globally for serving static files
RUN npm install -g serve

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]