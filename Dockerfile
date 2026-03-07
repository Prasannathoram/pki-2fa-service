#############################
# Stage 1: Builder
#############################
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

#############################
# Stage 2: Runtime
#############################
FROM node:20-slim

WORKDIR /app

# Set timezone
ENV TZ=UTC

# Install cron and timezone tools
RUN apt-get update && \
    apt-get install -y cron tzdata && \
    ln -fs /usr/share/zoneinfo/UTC /etc/localtime && \
    dpkg-reconfigure --frontend noninteractive tzdata && \
    rm -rf /var/lib/apt/lists/*

# Create required directories
RUN mkdir -p /data /cron

# Copy built app from builder
COPY --from=builder /app /app

# Copy cron configuration
COPY cron/2fa-cron /etc/cron.d/2fa-cron

# Give correct permissions
RUN chmod 0644 /etc/cron.d/2fa-cron

# Register cron job
RUN crontab /etc/cron.d/2fa-cron

# Expose API port
EXPOSE 8080

# Start cron + server
CMD cron && node server.js