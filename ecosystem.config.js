module.exports = {
  apps : [{
    name: "voice-synthesis-api",
    script: "index.js",
    // NODE_OPTIONSを使用する場合
    env: {
      NODE_OPTIONS: "--max-old-space-size=1536",
    },
  }]
}