FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Install cron
RUN apt-get update && apt-get install -y cron

# Create directories
RUN mkdir -p /data /cron

# Add cron job
RUN echo "* * * * * /usr/local/bin/node /app/log_2fa_cron.js >> /cron/2fa.log 2>&1" > /etc/cron.d/2fa-cron

# Give permissions
RUN chmod 0644 /etc/cron.d/2fa-cron

# Apply cron job
RUN crontab /etc/cron.d/2fa-cron

# Start cron + server
CMD cron && node server.js