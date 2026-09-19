import { Injectable } from '@nestjs/common';
import { CalculateTaxDto, TaxpayerType } from './dto/calculate-tax.dto';
import { TAX_RATES } from './tax-rates.constants';

export interface TaxResult {
  taxpayerType: TaxpayerType;
  annualRevenue: number;
  breakdown: Record<string, number>;
  totalAnnualTax: number;
  totalMonthlyTax: number;
  effectiveRate: number;
  notes: string[];
  disclaimer: string;
}

@Injectable()
export class TaxCalculatorService {
  private readonly disclaimer =
    "Ushbu hisob-kitob taxminiy xarakterga ega va rasmiy soliq deklaratsiyasi oʻrnini bosmaydi. " +
    "Aniq maʼlumot uchun soliq.uz saytiga yoki litsenziyalangan soliq maslahatchisiga murojaat qiling.";

  calculate(dto: CalculateTaxDto): TaxResult {
    switch (dto.taxpayerType) {
      case TaxpayerType.YAGONA_SOLIQ:
        return this.calculateYagonaSoliq(dto);
      case TaxpayerType.QQS_TOLOVCHI:
        return this.calculateUmumiyTartib(dto);
      case TaxpayerType.YATT_QATIY:
        return this.calculateYattFixed(dto);
      default:
        throw new Error('Notoʻgʻri soliq toʻlovchi turi');
    }
  }

  private calculateYagonaSoliq(dto: CalculateTaxDto): TaxResult {
    const rate = TAX_RATES.YAGONA_SOLIQ_RATE;
    const annualTax = (dto.annualRevenue * rate) / 100;
    const notes: string[] = [];

    if (dto.annualRevenue > TAX_RATES.YAGONA_SOLIQ_THRESHOLD) {
      notes.push(
        `Diqqat: yillik aylanmangiz ${TAX_RATES.YAGONA_SOLIQ_THRESHOLD.toLocaleString('ru-RU')} soʻm chegarasidan oshdi. ` +
          'QQS toʻlovchisiga oʻtish talab etilishi mumkin — soliq inspektsiyasi bilan aniqlashtiring.',
      );
    }

    return {
      taxpayerType: dto.taxpayerType,
      annualRevenue: dto.annualRevenue,
      breakdown: {
        'Yagona soliq (aylanmadan)': this.round(annualTax),
      },
      totalAnnualTax: this.round(annualTax),
      totalMonthlyTax: this.round(annualTax / 12),
      effectiveRate: rate,
      notes,
      disclaimer: this.disclaimer,
    };
  }

  private calculateUmumiyTartib(dto: CalculateTaxDto): TaxResult {
    const expenses = dto.annualExpenses || 0;
    const vatRate = TAX_RATES.VAT_RATE;
    const profitRate = TAX_RATES.PROFIT_TAX_RATE;

    // Soddalashtirilgan QQS: tushumdan QQSni ajratib olish (tushum QQS bilan kelgan deb faraz qilinadi)
    const vatAmount = (dto.annualRevenue * vatRate) / (100 + vatRate);
    const revenueExcludingVat = dto.annualRevenue - vatAmount;

    const taxableProfit = Math.max(revenueExcludingVat - expenses, 0);
    const profitTax = (taxableProfit * profitRate) / 100;

    const totalAnnualTax = vatAmount + profitTax;
    const notes = [
      "QQS hisob-kitobi soddalashtirilgan boʻlib, kirim QQSini (offset) hisobga olmaydi.",
      'Aniq hisob-kitob uchun buxgalter bilan maslahatlashing.',
    ];

    return {
      taxpayerType: dto.taxpayerType,
      annualRevenue: dto.annualRevenue,
      breakdown: {
        "Qo'shilgan qiymat solig'i (QQS)": this.round(vatAmount),
        "Foyda solig'i": this.round(profitTax),
      },
      totalAnnualTax: this.round(totalAnnualTax),
      totalMonthlyTax: this.round(totalAnnualTax / 12),
      effectiveRate: this.round((totalAnnualTax / dto.annualRevenue) * 100),
      notes,
      disclaimer: this.disclaimer,
    };
  }

  private calculateYattFixed(dto: CalculateTaxDto): TaxResult {
    const region = dto.region || 'default';
    const monthlyFixed =
      TAX_RATES.YATT_FIXED_TAX_MONTHLY[region] ||
      TAX_RATES.YATT_FIXED_TAX_MONTHLY.default;
    const annualTax = monthlyFixed * 12;

    return {
      taxpayerType: dto.taxpayerType,
      annualRevenue: dto.annualRevenue,
      breakdown: {
        "Qat'iy belgilangan soliq (oylik)": monthlyFixed,
        "Qat'iy belgilangan soliq (yillik)": annualTax,
      },
      totalAnnualTax: annualTax,
      totalMonthlyTax: monthlyFixed,
      effectiveRate:
        dto.annualRevenue > 0
          ? this.round((annualTax / dto.annualRevenue) * 100)
          : 0,
      notes: [
        "YATT qat'iy belgilangan soliq aylanma hajmidan qat'i nazar belgilanadi.",
      ],
      disclaimer: this.disclaimer,
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
