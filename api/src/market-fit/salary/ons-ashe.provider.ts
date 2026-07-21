import { Injectable } from '@nestjs/common';
import type { MarketFitSalaryBand } from '../../shared/schemas/market-fit.schema';
import {
  ONS_ASHE_ATTRIBUTION,
  ONS_ASHE_UK,
  type OnsAsheOccupation,
} from './data/ons-ashe-uk';

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s+/&-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class OnsAsheProvider {
  readonly attribution = ONS_ASHE_ATTRIBUTION;

  lookup(title: string): MarketFitSalaryBand | null {
    const occ = this.matchOccupation(title);
    if (!occ) return null;
    return {
      min: occ.p25,
      max: occ.p75,
      median: occ.median,
      period: 'year',
      currency: 'GBP',
      source: 'ons_ashe',
      label: `ONS ASHE · ${occ.title}`,
    };
  }

  private matchOccupation(title: string): OnsAsheOccupation | null {
    const needle = normalizeTitle(title);
    if (!needle) return null;

    let best: { occ: OnsAsheOccupation; score: number } | null = null;

    for (const occ of ONS_ASHE_UK) {
      const candidates = [occ.title, ...occ.aliases].map(normalizeTitle);
      for (const cand of candidates) {
        let score = 0;
        if (cand === needle) score = 100;
        else if (needle.includes(cand) || cand.includes(needle)) score = 80;
        else {
          const needleTokens = new Set(needle.split(' '));
          const candTokens = cand.split(' ');
          const overlap = candTokens.filter((t) => needleTokens.has(t)).length;
          if (overlap >= 2) score = 50 + overlap * 5;
          else if (overlap === 1 && candTokens.length <= 2) score = 40;
        }
        if (score > 0 && (!best || score > best.score)) {
          best = { occ, score };
        }
      }
    }

    return best && best.score >= 40 ? best.occ : null;
  }
}
