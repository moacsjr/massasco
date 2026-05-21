#!/bin/bash
# Runtime-only setup. All build work (pnpm install, prisma generate, nx build)
# happens in CI; the deploy artifact already contains node_modules, .next, and dist.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Application root directory resolved to: $APP_DIR"

# CodeDeploy extracts files as root — fix ownership so ec2-user can write
sudo chown -R ec2-user:ec2-user "$APP_DIR"

cd "$APP_DIR"

export HOME="/home/ec2-user"
export NVM_DIR="/home/ec2-user/.nvm"
export PATH="/usr/bin:/usr/local/bin:/usr/sbin:/usr/local/sbin:$PATH"

# Load NVM and pin Node 22 (matches CI build version)
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null

# Fetch runtime config from SSM and write .env
echo "Fetching runtime config from SSM..."
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
PROJECT_NAME="devxp-portal"

# DATABASE_URL is required — fail the deploy loudly if SSM doesn't have it.
DATABASE_URL=$(aws ssm get-parameter \
  --name "/${PROJECT_NAME}/database_url" \
  --with-decryption \
  --query Parameter.Value --output text --region "$REGION")
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "None" ]; then
  echo "ERROR: /${PROJECT_NAME}/database_url is missing in SSM (region $REGION)."
  exit 1
fi

CDN_URL=$(aws ssm get-parameter \
  --name "/${PROJECT_NAME}/cloudfront_url" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
MEDIA_BUCKET=$(aws ssm get-parameter \
  --name "/${PROJECT_NAME}/media_bucket_name" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")

{
  echo "DATABASE_URL=\"${DATABASE_URL}\""
  [ -n "$CDN_URL" ] && echo "NEXT_PUBLIC_CDN_URL=\"${CDN_URL}\""
  [ -n "$MEDIA_BUCKET" ] && echo "AWS_S3_BUCKET_NAME=\"${MEDIA_BUCKET}\""
} > .env
chmod 600 .env
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

echo "Waiting for database to be ready..."
for i in {1..30}; do
  if docker exec $(docker ps -q -f name=db) pg_isready -U postgres &>/dev/null; then
    echo "Database is ready!"
    break
  fi
  echo "Waiting for database... ($i/30)"
  sleep 2
done

# Apply migrations against the running DB (uses prisma CLI from the shipped node_modules)
echo "Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy

exit 0
