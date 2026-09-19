import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AiProvider {
  name: string;
  client: OpenAI;
  model: string;
}

/**
 * AiService bir nechta OpenAI-mos AI provayder bilan ishlashi mumkin
 * (masalan, Google Gemini asosiy, Groq yoki OpenRouter zaxira sifatida).
 * Agar asosiy provayder xatolik bersa (limit tugashi, vaqtinchalik
 * ishlamay qolishi, model oʻchirilgani va h.k.), avtomatik ravishda
 * navbatdagi provayderga oʻtiladi — foydalanuvchi buni sezmaydi.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly providers: AiProvider[] = [];

  constructor(private readonly configService: ConfigService) {
    // MUHIM: har bir provayder guruhi (asosiy/zaxira) bir nechta API
    // kalitni (masalan, bir nechta Gemini yoki Groq akkaunt) qo'llab-
    // quvvatlaydi. Har bir kalit uchun alohida "provider" yozuvi
    // yaratiladi, shuning uchun bittasi kunlik/daqiqalik limitga (429)
    // tushsa, withProviderFallback avtomatik ravishda navbatdagi kalitga
    // (boshqa akkauntga o'tgandek) o'tadi.
    this.registerProviderGroup(
      'asosiy',
      this.configService.get<string[]>('openai.apiKeys') || [],
      this.configService.get<string>('openai.baseUrl'),
      this.configService.get<string>('openai.model') || 'gpt-4o-mini',
    );

    this.registerProviderGroup(
      'zaxira',
      this.configService.get<string[]>('aiFallback.apiKeys') || [],
      this.configService.get<string>('aiFallback.baseUrl'),
      this.configService.get<string>('aiFallback.model') || 'gpt-4o-mini',
    );

    if (this.providers.length === 0) {
      this.logger.warn(
        "Hech qanday AI provayder sozlanmagan (OPENAI_API_KEY boʻsh). " +
        'Biznes-reja, bozor tahlili va chatbot funksiyalari ishlamaydi.',
      );
    } else {
      this.logger.log(
        `AI provayderlar sozlandi: ${this.providers.map((p) => `${p.name}(${p.model})`).join(', ')}`,
      );
    }
  }

  /**
   * Bitta guruh (asosiy yoki zaxira) uchun bir nechta API kalitni alohida
   * provayder sifatida ro'yxatdan o'tkazadi. Masalan, `apiKeys` ["k1","k2"]
   * bo'lsa, "asosiy-1" va "asosiy-2" nomli ikkita mustaqil provayder
   * yaratiladi — ular navbat bilan sinab ko'riladi.
   */
  private registerProviderGroup(
    groupName: string,
    apiKeys: string[],
    baseUrl: string | undefined,
    model: string,
  ): void {
    apiKeys.forEach((apiKey, index) => {
      const name = apiKeys.length > 1 ? `${groupName}-${index + 1}` : groupName;
      this.providers.push({
        name,
        client: new OpenAI({ apiKey, baseURL: baseUrl }),
        model,
      });
    });
  }

  /**
   * Erkin suhbat: berilgan xabarlar tarixi asosida AI javobini qaytaradi.
   */
  async chat(messages: ChatTurn[], temperature = 0.4): Promise<string> {
    return this.withProviderFallback(async (provider) => {
      const completion = await provider.client.chat.completions.create({
        model: provider.model,
        messages,
        temperature,
        // DIQQAT: max_tokens ko'rsatilmasa, ba'zi provayderlar (masalan
        // Groq) modelning standart (juda katta) chiqish limitidan
        // foydalanadi va bepul tarifning "daqiqada chiqish tokeni" (OTPM)
        // chegarasidan (odatda ~1000) oshib, 429 xatosini qaytaradi.
        // Shuning uchun oqilona chegarani o'zimiz belgilaymiz.
        max_tokens: 700,
      });

      return (
        completion.choices[0]?.message?.content?.trim() ||
        'Kechirasiz, javob generatsiya qilishda muammo yuz berdi.'
      );
    }, 'chat');
  }

  /**
   * Strukturaviy JSON javob olish uchun (masalan, biznes-reja bo'limlari).
   * Ba'zi (ayniqsa bepul) provayderlar `response_format: json_object`ni
   * qo'llab-quvvatlamaydi — bunday holda oddiy matn rejimiga o'tib,
   * javobdan JSON qismini o'zimiz ajratib olamiz.
   */
  async generateJson<T = any>(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<T> {
    return this.withProviderFallback(async (provider) => {
      let raw: string;

      try {
        const completion = await provider.client.chat.completions.create({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
          max_tokens: 900,
        });
        raw = completion.choices[0]?.message?.content || '{}';
      } catch (formatError) {
        this.logger.warn(
          `${provider.name}: response_format (json_object) qoʻllab-quvvatlanmadi, oddiy matn rejimiga oʻtildi. (${(formatError as Error).message})`,
        );

        const completion = await provider.client.chat.completions.create({
          model: provider.model,
          messages: [
            {
              role: 'system',
              content: `${systemPrompt}\n\nJavobni FAQAT toza JSON koʻrinishida qaytar — hech qanday qoʻshimcha matn, izoh yoki markdown (\`\`\`) belgilarisiz.`,
            },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 900,
        });
        raw = completion.choices[0]?.message?.content || '{}';
      }

      return JSON.parse(this.extractJson(raw)) as T;
    }, 'generateJson');
  }

  /**
   * AI ba'zan JSON'ni ```json ... ``` bilan o'rab yoki oldiga/orqasiga
   * qo'shimcha matn qo'shib yuborishi mumkin — buni tozalaymiz.
   */
  private extractJson(raw: string): string {
    const trimmed = raw.trim();

    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced) {
      return fenced[1];
    }

    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      return trimmed.slice(first, last + 1);
    }

    return trimmed;
  }

  private async withProviderFallback<T>(
    fn: (provider: AiProvider) => Promise<T>,
    context: string,
  ): Promise<T> {
    if (this.providers.length === 0) {
      throw new ServiceUnavailableException(
        'AI xizmati sozlanmagan. Administrator bilan bogʻlaning.',
      );
    }

    for (const provider of this.providers) {
      // DIQQAT: 429 (rate limit) xatoligi ko'pincha vaqtinchalik bo'ladi —
      // ayniqsa bepul tarif "so'rovlar/daqiqa" (RPM) chegarasi tufayli.
      // Shuning uchun bitta provayderda 429 chiqsa, keyingi provayderga
      // o'tishdan oldin qisqa kutish bilan bir marta qayta urinib ko'ramiz.
      const maxAttempts = 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn(provider);
        } catch (error) {
          const status = (error as { status?: number })?.status;
          this.logDetailedError(
            `${context} (${provider.name}, urinish ${attempt}/${maxAttempts})`,
            error,
            provider,
          );

          const isRateLimit = status === 429;
          const hasMoreAttempts = attempt < maxAttempts;
          if (isRateLimit && hasMoreAttempts) {
            await this.delay(2000 * attempt);
            continue;
          }
          break;
        }
      }
    }

    throw new ServiceUnavailableException(
      'AI xizmati vaqtincha ishlamayapti (barcha provayderlar javob bermadi yoki limit tugadi). ' +
      'Iltimos, birozdan so\'ng qaytadan urinib ko\'ring — bu odatda AI provayderning bepul tarif ' +
      'limiti bilan bog\'liq va kodning xatosi emas.',
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private logDetailedError(
    context: string,
    error: unknown,
    provider?: AiProvider,
  ): void {
    const err = error as {
      status?: number;
      message?: string;
      error?: unknown;
    };

    this.logger.error(
      `${context} | status=${err?.status ?? "noma'lum"} | baseURL=${provider?.client.baseURL ?? '-'
      } | model=${provider?.model ?? '-'} | message=${err?.message ?? String(error)}`,
    );

    if (err?.error) {
      this.logger.error(
        `Server javobi: ${JSON.stringify(err.error).slice(0, 500)}`,
      );
    }
  }
}