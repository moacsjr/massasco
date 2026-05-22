module.exports = {
  apps: [
    {
      name: 'devx-portal',
      // Nx entry point — resolves project targets, path aliases, and plugin config
      script: './node_modules/nx/bin/nx.js',
      args: 'run app:start',
      cwd: '/home/ec2-user/meu-app',
      instances: 1,
      autorestart: true,
      // Merge the .env file into the process environment at startup.
      // Path is relative to cwd (/home/ec2-user/meu-app).
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
