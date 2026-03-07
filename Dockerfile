FROM node:20-slim

WORKDIR /app

# install dependencies
COPY package*.json ./
RUN npm install

# copy project files
COPY . .

# install cron
RUN apt-get update && apt-get install -y cron

# create required directories
RUN mkdir -p /data /cron

# copy cron configuration
COPY cron/2fa-cron /etc/cron.d/2fa-cron

# set permissions
RUN chmod 0644 /etc/cron.d/2fa-cron

# register cron job
RUN crontab /etc/cron.d/2fa-cron

# start cron and server
CMD cron && node server.js