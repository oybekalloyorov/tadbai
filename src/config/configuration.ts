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

  // MUHIM: OPENAI_API_KEY bir nechta kalitni vergul bilan ajratib qabul
  // qiladi (masalan, bir nechta Gemini/Groq akkaunt kaliti): "key1,key2,key3".
  // Bitta kalit limitga (429) tushsa, AiService navbatdagi kalitga (xuddi
  // boshqa "akkaunt"ga o'tgandek) avtomatik o'tadi. Bitta kalit yozsangiz
  // ham hech narsa o'zgarmaydi — oddiy holatda ishlayveradi.
  openai: {
    apiKeys: (process.env.OPENAI_API_KEY || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  },

  // Zaxira (fallback) AI provayder — asosiysi (barcha kalitlari bilan)
  // ishlamay qolsa avtomatik shunga o'tiladi. Bu ham bir nechta kalitni
  // (vergul bilan ajratilgan) qo'llab-quvvatlaydi. Ixtiyoriy: bo'sh bo'lsa
  // ishlatilmaydi.
  aiFallback: {
    apiKeys: (process.env.AI_FALLBACK_API_KEY || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean),
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