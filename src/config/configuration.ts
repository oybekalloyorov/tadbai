export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  },

  // Zaxira (fallback) AI provayder — asosiysi ishlamay qolsa avtomatik
  // shunga o'tiladi. Ixtiyoriy: AI_FALLBACK_API_KEY bo'sh bo'lsa ishlatilmaydi.
  aiFallback: {
    apiKey: process.env.AI_FALLBACK_API_KEY,
    model: process.env.AI_FALLBACK_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.AI_FALLBACK_BASE_URL,
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '30', 10),
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
});