#!/bin/bash
# Install and configure system dependencies

echo "Preparing environment..."

# 1. Update OS and Install basic tools
sudo yum update -y || sudo dnf update -y
sudo yum install -y curl git || sudo dnf install -y curl git

# 2. Install Docker if not installed
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  sudo yum install -y docker || sudo dnf install -y docker
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker ec2-user
fi

# Ensure docker service is running
sudo systemctl start docker

# Install Docker Compose if not available
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
  echo "Installing Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# 3. Install Node.js via NVM (non-root, perfect for ec2-user)
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
  echo "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# Load NVM
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if ! command -v node &> /dev/null; then
  echo "Installing Node.js v20..."
  nvm install 20
  nvm use 20
  nvm alias default 20
fi

# 4. Install pnpm and pm2 globally for ec2-user
echo "Installing pnpm and PM2..."
npm install -g pnpm pm2

exit 0
