#############################
# Stage 1: Builder
#############################
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

#############################
# Stage 2: Runtime
#############################
FROM node:20-slim

# Set working directory
WORKDIR /app

# Set timezone to UTC
ENV TZ=UTC

# Install cron + timezone tools
RUN apt-get update && \
    apt-get install -y cron tzdata && \
    ln -fs /usr/share/zoneinfo/UTC /etc/localtime && \
    dpkg-reconfigure --frontend noninteractive tzdata && \
    rm -rf /var/lib/apt/lists/*

# Create mount points
RUN mkdir -p /data /cron

# Copy built node_modules and app code from builder
COPY --from=builder /app /app

# Copy cron configuration
COPY cron/2fa-cron /etc/cron.d/2fa-cron
RUN chmod 0644 /etc/cron.d/2fa-cron && crontab /etc/cron.d/2fa-cron

# Expose API port
EXPOSE 8080

# Start cron and API server
CMD service cron start && node server.js
