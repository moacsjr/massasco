module.exports = {
  apps: [
    {
      name: 'devx-portal',
      // Use the global next binary shipped in node_modules
      script: 'node_modules/next/dist/bin/next',
      // Next.js needs to run from the apps/app directory (where .next/ and .env live)
      cwd: 'apps/app',
      args: ['start', '-p', '3000'],
      instances: 1,
      autorestart: true,
      // Reload env from the .env file on every start/restart
      env: {},
      // Merge the .env file into the process environment at startup.
      // Path is relative to the deploy root (/home/ec2-user/meu-app), not cwd.
      env_file: 'apps/app/.env',
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
