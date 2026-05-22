// @ts-check

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  // Nx's withNx plugin is only needed for dev/build.
  // In production (next start), Next.js only needs the raw config.

  // Prevent Next.js from bundling AWS SDK into .next/server/chunks/.
  // The SDK does dynamic requires (e.g. @aws/lambda-invoke-store) that
  // fail when statically bundled on EC2 — let Node resolve from node_modules instead.
  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/core'],
};

module.exports = nextConfig;
