#!/bin/bash
# Stop PM2 process if it exists

echo "Stopping application..."

# Load Node.js and PM2 environment
export NVM_DIR="$HOME/.nvm"
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

# Stop Docker Compose containers if running to allow clean restart
if command -v docker &> /dev/null; then
  if [ -d "/home/ec2-user/meu-app" ]; then
    echo "Stopping docker-compose services..."
    cd /home/ec2-user/meu-app
    if command -v docker-compose &> /dev/null; then
      docker-compose -f docker/docker-compose.yml down || true
    elif docker compose version &> /dev/null; then
      docker compose -f docker/docker-compose.yml down || true
    fi
  fi
fi

exit 0
