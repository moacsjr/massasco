#!/bin/bash
# Install dependencies, setup database, run migrations, and build app

# Resolve the application root directory dynamically (relative to this script's location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Application root directory resolved to: $APP_DIR"

# CodeDeploy extracts files as root — fix ownership so ec2-user can write
sudo chown -R ec2-user:ec2-user "$APP_DIR"

cd "$APP_DIR"

# Define standard home and path variables for CodeDeploy environment
export HOME="/home/ec2-user"
export NVM_DIR="/home/ec2-user/.nvm"
export PATH="/usr/bin:/usr/local/bin:/usr/sbin:/usr/local/sbin:/home/ec2-user/.nvm/versions/node/v20.0.0/bin:$PATH"

# Load Node.js and PM2 environment
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Fetch runtime config from SSM and write .env
echo "Fetching runtime config from SSM..."
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
PROJECT_NAME="devxp-portal"
CDN_URL=$(aws ssm get-parameter \
  --name "/${PROJECT_NAME}/cloudfront_url" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
MEDIA_BUCKET=$(aws ssm get-parameter \
  --name "/${PROJECT_NAME}/media_bucket_name" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")

{
  echo "DATABASE_URL=\"postgresql://postgres:password@localhost:5432/devxp?schema=public\""
  [ -n "$CDN_URL" ] && echo "NEXT_PUBLIC_CDN_URL=\"${CDN_URL}\""
  [ -n "$MEDIA_BUCKET" ] && echo "AWS_S3_BUCKET_NAME=\"${MEDIA_BUCKET}\""
} > .env
echo ".env created with $(wc -l < .env) entries."

# Start PostgreSQL database container
echo "Starting PostgreSQL database container..."
if command -v docker-compose &> /dev/null; then
  docker-compose -f docker/docker-compose.yml up -d
elif docker compose version &> /dev/null; then
  docker compose -f docker/docker-compose.yml up -d
else
  echo "Error: docker-compose/docker compose not found!"
  exit 1
fi

# Wait for PostgreSQL container to start and accept connections
echo "Waiting for database to be ready..."
for i in {1..30}; do
  if docker exec $(docker ps -q -f name=db) pg_isready -U postgres &>/dev/null; then
    echo "Database is ready!"
    break
  fi
  echo "Waiting for database... ($i/30)"
  sleep 2
done

# Install dependencies using pnpm
echo "Installing project dependencies..."
pnpm install

# Generate Prisma Client
echo "Generating Prisma Client..."
pnpm prisma generate

# Run Prisma migrations
echo "Running Prisma migrations..."
pnpm prisma migrate deploy



exit 0
