#!/bin/bash
# Stop PM2 process if it exists

echo "Stopping application..."

# Define standard home and path variables for CodeDeploy environment
export HOME="/home/ec2-user"
export NVM_DIR="/home/ec2-user/.nvm"
export PATH="/usr/bin:/usr/local/bin:/usr/sbin:/usr/local/sbin:/home/ec2-user/.nvm/versions/node/v20.0.0/bin:$PATH"

# Load Node.js and PM2 environment
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check if pm2 is installed
if command -v pm2 &> /dev/null; then
  echo "PM2 is installed. Checking for running devx-portal process..."
  if pm2 describe devx-portal &> /dev/null; then
    echo "Stopping devx-portal process..."
    pm2 stop devx-portal
    pm2 delete devx-portal
  else
    echo "devx-portal process is not running."
  fi
else
  echo "PM2 is not installed or not in PATH."
fi

# Resolve the application root directory dynamically (relative to this script's location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Stop Docker Compose containers if running to allow clean restart
if command -v docker &> /dev/null; then
  if [ -d "$APP_DIR" ]; then
    echo "Stopping docker-compose services in $APP_DIR..."
    cd "$APP_DIR"
    if command -v docker-compose &> /dev/null; then
      docker-compose -f docker/docker-compose.yml down || true
    elif docker compose version &> /dev/null; then
      docker compose -f docker/docker-compose.yml down || true
    fi
  fi
fi

exit 0
