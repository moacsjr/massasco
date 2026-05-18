#!/bin/bash
# Start the Next.js app using PM2

echo "Starting application..."

cd /home/ec2-user/meu-app

# Define standard home and path variables for CodeDeploy environment
export HOME="/home/ec2-user"
export NVM_DIR="/home/ec2-user/.nvm"
export PATH="/usr/bin:/usr/local/bin:/usr/sbin:/usr/local/sbin:/home/ec2-user/.nvm/versions/node/v20.0.0/bin:$PATH"

# Load Node.js and PM2 environment
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Start application using PM2
echo "Launching devx-portal using PM2..."
pm2 start "pnpm nx start app" --name "devx-portal"

# Save PM2 process list to restore on reboot
pm2 save

exit 0
