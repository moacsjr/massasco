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
  serverExternalPackages: [
    '@aws-sdk/client-s3',
    '@aws-sdk/core',
    '@aws-sdk/client-cognito-identity-provider',
  ],
  // Standalone is only for the local Docker image; Amplify uses its own adapter.
  ...(process.env.NEXT_OUTPUT_STANDALONE === '1' && { output: 'standalone' }),
};

module.exports = nextConfig;
