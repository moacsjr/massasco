#!/bin/bash
# Start the Next.js app using PM2

echo "Starting application..."

# CodeDeploy runs hook scripts from its staging area, not from the install
# destination. Use the destination defined in appspec.yml so PM2 doesn't run
# against a directory CodeDeploy may rotate or remove.
APP_DIR="/home/ec2-user/meu-app"

echo "Application root directory: $APP_DIR"
cd "$APP_DIR"

# Define standard home and path variables for CodeDeploy environment
export HOME="/home/ec2-user"
export NVM_DIR="/home/ec2-user/.nvm"
export PATH="/usr/bin:/usr/local/bin:/usr/sbin:/usr/local/sbin:$PATH"

# Load Node.js (pinned to v22 in before_install.sh)
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null

# Stop any prior instance so we start clean (idempotent)
pm2 delete devx-portal 2>/dev/null || true

# Load runtime env (written by after_install.sh) into the shell so PM2 passes
# DATABASE_URL & friends directly to the Node process. Don't depend on Next.js
# auto-loading apps/app/.env — failure mode is silent at boot.
ENV_FILE="$APP_DIR/apps/app/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE missing — after_install.sh should have created it."
  exit 1
fi
set -a
. "$ENV_FILE"
set +a

# Start Next.js directly under PM2 (no Nx in the runtime path)
echo "Launching devx-portal using PM2..."
pm2 start node_modules/next/dist/bin/next \
  --name "devx-portal" \
  --cwd "$APP_DIR/apps/app" \
  --update-env \
  -- start -p 3000

# Save PM2 process list to restore on reboot
pm2 save

exit 0
