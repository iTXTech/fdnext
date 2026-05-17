module.exports = {
  apps: [
    {
      name: "fdnext-server",
      script: "packages/server/dist/bin.js",
      args: "--host 0.0.0.0 --port 8080 --resources ./packages/core/resources",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
