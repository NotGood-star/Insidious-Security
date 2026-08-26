const timestamp = () => `[${new Date().toISOString()}]`;

module.exports = {
  info: (msg) => console.log(`${timestamp()} 🤖 [INFO] ${msg}`),
  success: (msg) => console.log(`${timestamp()} 📦 [SUCCESS] ${msg}`),
  warn: (msg) => console.warn(`${timestamp()} 🟡 [WARN] ${msg}`),
  error: (msg, err) => console.error(`${timestamp()} ❌ [ERROR] ${msg}`, err || ''),
  music: (msg) => console.log(`${timestamp()} 🎵 [MUSIC] ${msg}`),
  db: (msg) => console.log(`${timestamp()} 🗄️ [DATABASE] ${msg}`)
};
