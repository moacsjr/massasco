#!/bin/bash
# Install and configure system dependencies

# Define standard home and path variables for CodeDeploy environment
export HOME="/home/ec2-user"
export NVM_DIR="/home/ec2-user/.nvm"
export PATH="/usr/bin:/usr/local/bin:/usr/sbin:/usr/local/sbin:$PATH"

echo "Preparing environment on Amazon Linux..."

# 1. Update OS and Install basic tools
sudo yum update -y || sudo dnf update -y
sudo yum install -y curl git || sudo dnf install -y curl git

# 2. Install Docker if not installed (handles AL2 and AL2023)
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  if command -v amazon-linux-extras &> /dev/null; then
    # Amazon Linux 2 method
    sudo amazon-linux-extras install docker -y
  else
    # Amazon Linux 2023 method
    sudo dnf install -y docker || sudo yum install -y docker
  fi
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker ec2-user
fi

# Ensure docker service is running
sudo systemctl start docker

# 3. Install Docker Compose if not available
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
  echo "Installing Docker Compose..."
  # Try packages first
  if sudo dnf install -y docker-compose-plugin &> /dev/null || sudo yum install -y docker-compose-plugin &> /dev/null; then
    echo "Docker Compose plugin installed via package manager."
  else
    # Fallback to binary download in /usr/bin to guarantee CodeDeploy path visibility
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose
    sudo chmod +x /usr/bin/docker-compose
    # Create symlink so 'docker compose' sub-command syntax is also available
    sudo mkdir -p /usr/lib/docker/cli-plugins
    sudo ln -s /usr/bin/docker-compose /usr/lib/docker/cli-plugins/docker-compose
  fi
fi

# 4. Install Node.js via NVM (non-root, perfect for ec2-user)
if [ ! -d "$NVM_DIR" ]; then
  echo "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# Load NVM
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Ensure Node 22 is installed and active (matches CI build node version)
echo "Ensuring Node.js v22 is installed..."
nvm install 22
nvm use 22
nvm alias default 22

# Ensure correct path to Node binary is set
export PATH="$NVM_DIR/versions/node/$(nvm current)/bin:$PATH"

# 5. Install pnpm and pm2 globally for ec2-user
echo "Installing pnpm and PM2..."
npm install -g pnpm pm2

exit 0
