#!/bin/bash
# Start the Next.js app using PM2

echo "Starting application..."

# Resolve the application root directory dynamically (relative to this script's location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Application root directory resolved to: $APP_DIR"
cd "$APP_DIR"

# Define standard home and path variables for CodeDeploy environment
export HOME="/home/ec2-user"
export NVM_DIR="/home/ec2-user/.nvm"
export PATH="/usr/bin:/usr/local/bin:/usr/sbin:/usr/local/sbin:/home/ec2-user/.nvm/versions/node/v20.0.0/bin:$PATH"

# Load Node.js and PM2 environment
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Stop any prior instance so we start clean (idempotent)
pm2 delete devx-portal 2>/dev/null || true

# Start Next.js directly under PM2 (no Nx in the runtime path)
echo "Launching devx-portal using PM2..."
pm2 start node_modules/next/dist/bin/next \
  --name "devx-portal" \
  --cwd "$APP_DIR/apps/app" \
  -- start -p 3000

# Save PM2 process list to restore on reboot
pm2 save

exit 0
