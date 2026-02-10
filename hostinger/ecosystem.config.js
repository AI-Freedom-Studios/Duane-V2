module.exports = {
  apps: [
    {
      name: 'agentos-api',
      cwd: '/opt/agentos/apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      max_memory_restart: '500M',
      error_file: '/var/log/agentos/api-error.log',
      out_file: '/var/log/agentos/api-out.log',
      merge_logs: true,
    },
    {
      name: 'agentos-web',
      cwd: '/opt/agentos/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '500M',
      error_file: '/var/log/agentos/web-error.log',
      out_file: '/var/log/agentos/web-out.log',
      merge_logs: true,
    },
  ],
};
