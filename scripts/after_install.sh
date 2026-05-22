#!/bin/bash
# Runtime-only setup. CI produces the build artifacts (.next, dist);
# node_modules is included in the deploy tarball, but pnpm's symlinked
# store often breaks during extraction — pnpm install --frozen-lockfile
# reconstructs it correctly without downloading anything new.
set -e

# CodeDeploy runs hook scripts from the staging area
# (/opt/codedeploy-agent/.../deployment-archive), but the app is installed at
# the destination defined in appspec.yml. Always operate on the installed copy.
APP_DIR="/home/ec2-user/meu-app"

echo "Application root directory: $APP_DIR"

# CodeDeploy extracts files as root — fix ownership so ec2-user can write
sudo chown -R ec2-user:ec2-user "$APP_DIR"

cd "$APP_DIR"

export HOME="/home/ec2-user"
export NVM_DIR="/home/ec2-user/.nvm"
export PATH="/usr/bin:/usr/local/bin:/usr/sbin:/usr/local/sbin:$PATH"

# Load NVM and pin Node 22 (matches CI build version)
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null

# Rebuild pnpm store symlinks.
echo "Cleaning old modules to prevent TTY issues..."
# Remove os links quebrados antigos para o pnpm trabalhar em um escopo limpo
rm -rf node_modules

echo "Rebuilding pnpm symlinks..."
# Força o modo CI e injeta a flag para desativar a confirmação de expurgo
CI=true pnpm install --frozen-lockfile --prefer-offline --config.confirm-modules-purge=false

# Fetch runtime config from SSM and write .env
echo "Fetching runtime config from SSM..."

# IMDSv2: fetch a session token first, then use it to read metadata.
IMDS_TOKEN=$(curl -sf -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 300" || echo "")
REGION=$(curl -sf -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" \
  http://169.254.169.254/latest/meta-data/placement/region || echo "")
if [ -z "$REGION" ]; then
  echo "ERROR: could not resolve EC2 region from IMDS."
  exit 1
fi
echo "Resolved region: $REGION"

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
if [ -z "$CDN_URL" ] || [ "$CDN_URL" = "None" ]; then
  echo "ERROR: /${PROJECT_NAME}/cloudfront_url is missing in SSM (region $REGION)."
  exit 1
fi

MEDIA_BUCKET=$(aws ssm get-parameter \
  --name "/${PROJECT_NAME}/media_bucket_name" \
  --query Parameter.Value --output text --region "$REGION" 2>/dev/null || echo "")
if [ -z "$MEDIA_BUCKET" ] || [ "$MEDIA_BUCKET" = "None" ]; then
  echo "ERROR: /${PROJECT_NAME}/media_bucket_name is missing in SSM (region $REGION)."
  exit 1
fi

# Next.js is launched with --cwd apps/app, so it reads .env from there.
# Prisma CLI (run from $APP_DIR below) reads DATABASE_URL from the shell env,
# which we export explicitly so we don't need a duplicate root .env.
ENV_FILE="apps/app/.env"
{
  echo "DATABASE_URL=\"${DATABASE_URL}\""
  echo "NEXT_PUBLIC_CDN_URL=\"${CDN_URL}\""
  echo "AWS_S3_BUCKET_NAME=\"${MEDIA_BUCKET}\""
} > "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo "$ENV_FILE created with $(wc -l < "$ENV_FILE") entries."

export DATABASE_URL

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

# Regenerate Prisma Client + engines (native binaries may not survive tar extraction).
# Uses local prisma from node_modules; --schema ensures correct path.
# This downloads the RHEL schema-engine binary at runtime if not bundled.
echo "Generating Prisma Client..."
node_modules/.bin/prisma generate --schema=prisma/schema.prisma

# Apply migrations against the running DB
echo "Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

exit 0
