#!/bin/bash
# Start the Next.js app using PM2

echo "Starting application..."

cd /home/ec2-user/meu-app

# Load Node.js and PM2 environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Start application using PM2
echo "Launching devx-portal using PM2..."
pm2 start "pnpm nx start app" --name "devx-portal"

# Save PM2 process list to restore on reboot
pm2 save

exit 0
