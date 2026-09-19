/**
 * PM2 production configuration for the VPS.
 *
 * The current app does not require an external database, API key, or server
 * credential. Keep future secrets in the VPS environment rather than
 * committing their values to this file.
 */
module.exports = {
  apps: [
    {
      name: "railsops-workforce-tracker",
      cwd: __dirname,
      script: ".output/server/index.mjs",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 3010,
        NITRO_HOST: "0.0.0.0",
        NITRO_PORT: 3010,
      },
    },
  ],
};