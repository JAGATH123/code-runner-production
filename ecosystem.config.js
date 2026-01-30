// PM2 Configuration for VPS Deployment
// This runs multiple API and Runner instances for high availability

module.exports = {
  apps: [
    // API Instances (2 instances for failover)
    {
      name: 'api-1',
      script: './apps/api/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: './logs/api-1-error.log',
      out_file: './logs/api-1-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'api-2',
      script: './apps/api/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
      },
      error_file: './logs/api-2-error.log',
      out_file: './logs/api-2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },

    // Runner Instances (2 instances for load distribution)
    {
      name: 'runner-1',
      script: './apps/runner/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        // Container pool configuration
        ENABLE_CONTAINER_POOL: 'true',
        POOL_MIN_SIZE: 2,
        POOL_MAX_SIZE: 5,
        POOL_MAX_CONTAINER_AGE_MS: 1800000, // 30 minutes
        SANDBOX_IMAGE: 'python-code-runner',
        // Worker concurrency
        WORKER_CONCURRENCY_EXECUTION: 3,
        WORKER_CONCURRENCY_SUBMISSION: 2,
      },
      error_file: './logs/runner-1-error.log',
      out_file: './logs/runner-1-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'runner-2',
      script: './apps/runner/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        // Container pool configuration
        ENABLE_CONTAINER_POOL: 'true',
        POOL_MIN_SIZE: 2,
        POOL_MAX_SIZE: 5,
        POOL_MAX_CONTAINER_AGE_MS: 1800000, // 30 minutes
        SANDBOX_IMAGE: 'python-code-runner',
        // Worker concurrency
        WORKER_CONCURRENCY_EXECUTION: 3,
        WORKER_CONCURRENCY_SUBMISSION: 2,
      },
      error_file: './logs/runner-2-error.log',
      out_file: './logs/runner-2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
