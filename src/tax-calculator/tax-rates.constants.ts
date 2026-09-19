/**
 * DIQQAT: Quyidagi stavkalar Oʻzbekiston Respublikasi Soliq kodeksiga muvofiq
 * taxminiy/namunaviy qiymatlar sifatida keltirilgan va har yili oʻzgarishi mumkin.
 * Ishlab chiqarishda foydalanishdan oldin joriy stavkalarni soliq.uz saytida
 * yoki soliq maslahatchisi bilan tasdiqlang. Bu qiymatlarni .env yoki admin panel
 * orqali sozlash tavsiya etiladi.
 */
export const TAX_RATES = {
  // Aylanmadan yagona soliq stavkasi (kichik biznes uchun, standart)
  YAGONA_SOLIQ_RATE: 4, // %

  // Umumbelgilangan tartib: foyda solig'i (yuridik shaxslar uchun)
  PROFIT_TAX_RATE: 15, // %

  // Qoʻshilgan qiymat solig'i (QQS)
  VAT_RATE: 12, // %

  // Yagona soliq toʻlovchi uchun yillik aylanma chegarasi (soʻmda)
  // Undan yuqori boʻlsa QQS toʻlovchiga oʻtish talab qilinishi mumkin
  YAGONA_SOLIQ_THRESHOLD: 1_000_000_000,

  // YATT uchun qat'iy belgilangan soliq (oyiga, soʻmda) — hududga qarab farqlanadi
  YATT_FIXED_TAX_MONTHLY: {
    toshkent_shahar: 450000,
    toshkent_viloyat: 320000,
    boshqa_viloyatlar: 250000,
    default: 300000,
  } as Record<string, number>,

  // Ijtimoiy soliq (ish haqidan, ish beruvchi uchun minimal stavka)
  SOCIAL_TAX_RATE: 12, // %
};
