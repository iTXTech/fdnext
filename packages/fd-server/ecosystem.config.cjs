module.exports = {
  apps: [
    {
      name: "fd-server",
      cwd: __dirname,
      script: "dist/bin.js",
      args: "--host 127.0.0.1 --port 8080",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        FD_SERVER_DEFAULT_LANG: "chs",
        FD_SERVER_CONTROLLER_GROUP: "selected",
        FD_SERVER_EXTRA_URLS: process.env.FD_SERVER_EXTRA_URLS ?? ""
      }
    }
  ]
};
