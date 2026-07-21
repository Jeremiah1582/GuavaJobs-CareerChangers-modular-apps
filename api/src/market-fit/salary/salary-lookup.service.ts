import { Injectable } from '@nestjs/common';
import type { SeniorityLevel } from '../../shared/schemas/enums.schema';
import type { MarketFitSalaryBand } from '../../shared/schemas/market-fit.schema';
import { ADZUNA_COUNTRIES } from '../../shared/constants/adzuna-countries';
import { EuroSalaryProvider } from './eurosalary.provider';
import { OnsAsheProvider } from './ons-ashe.provider';

@Injectable()
export class SalaryLookupService {
  constructor(
    private readonly onsAshe: OnsAsheProvider,
    private readonly euroSalary: EuroSalaryProvider,
  ) {}

  currencyForCountry(country: string): string {
    const row = ADZUNA_COUNTRIES.find((c) => c.code === country.toLowerCase());
    return row?.currency ?? 'EUR';
  }

  attributionsForCountry(country: string): string[] {
    const code = country.toLowerCase();
    if (code === 'gb') return [this.onsAshe.attribution];
    if (this.euroSalary.supportsCountry(code)) {
      return [this.euroSalary.attribution];
    }
    return [];
  }

  async lookup(
    title: string,
    country: string,
    seniority: SeniorityLevel,
  ): Promise<MarketFitSalaryBand | null> {
    const code = country.toLowerCase();
    if (code === 'gb') {
      return this.onsAshe.lookup(title);
    }
    if (this.euroSalary.supportsCountry(code)) {
      return this.euroSalary.lookup(title, code, seniority);
    }
    return null;
  }
}
