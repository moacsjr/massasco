module.exports = {
  apps: [
    {
      name: 'devx-portal',
      // Direct Next.js start — avoids Nx dependsOn:build cache issues on EC2.
      // The .next/ output is already built in CI and shipped in the deploy artifact.
      // Use absolute path for script since cwd is apps/app but node_modules is at the root.
      script: '/home/ec2-user/meu-app/node_modules/next/dist/bin/next',
      cwd: '/home/ec2-user/meu-app/apps/app',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      // Merge the .env file into the process environment at startup.
      // Path is relative to cwd (/home/ec2-user/meu-app/apps/app), so go up one level.
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '1G',
      // Graceful shutdown: give active requests time to finish
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
