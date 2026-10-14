# Multi-stage production Dockerfile for Backend Service
FROM node:20-alpine AS base

# Install security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy application source
COPY src/ ./src/
COPY database/ ./database/ 2>/dev/null || true

# Set environment
ENV NODE_ENV=production \
    PORT=5000

# Use non-root node user for security
USER node

# Expose backend REST API port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start server
CMD ["node", "src/server.js"]
