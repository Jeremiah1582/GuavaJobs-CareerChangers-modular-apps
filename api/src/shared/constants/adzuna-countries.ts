/**
 * Curated Adzuna job-market country codes for GuavaJobs (UK + IE + EU focus).
 * Codes are lowercase ISO 3166-1 alpha-2 as used in Adzuna paths (`/jobs/{country}/search`).
 */
export const ADZUNA_COUNTRIES = [
  { code: 'gb', label: 'United Kingdom', currency: 'GBP' },
  { code: 'ie', label: 'Ireland', currency: 'EUR' },
  { code: 'de', label: 'Germany', currency: 'EUR' },
  { code: 'fr', label: 'France', currency: 'EUR' },
  { code: 'nl', label: 'Netherlands', currency: 'EUR' },
  { code: 'es', label: 'Spain', currency: 'EUR' },
  { code: 'at', label: 'Austria', currency: 'EUR' },
  { code: 'be', label: 'Belgium', currency: 'EUR' },
  { code: 'ch', label: 'Switzerland', currency: 'CHF' },
  { code: 'it', label: 'Italy', currency: 'EUR' },
  { code: 'pt', label: 'Portugal', currency: 'EUR' },
  { code: 'pl', label: 'Poland', currency: 'PLN' },
  { code: 'se', label: 'Sweden', currency: 'SEK' },
  { code: 'dk', label: 'Denmark', currency: 'DKK' },
  { code: 'fi', label: 'Finland', currency: 'EUR' },
  { code: 'no', label: 'Norway', currency: 'NOK' },
  { code: 'cz', label: 'Czech Republic', currency: 'CZK' },
  { code: 'lu', label: 'Luxembourg', currency: 'EUR' },
] as const;

export type AdzunaCountryCode = (typeof ADZUNA_COUNTRIES)[number]['code'];

export const ADZUNA_COUNTRY_CODES = ADZUNA_COUNTRIES.map((c) => c.code) as [
  AdzunaCountryCode,
  ...AdzunaCountryCode[],
];

const ALIASES: Record<string, AdzunaCountryCode> = {
  uk: 'gb',
};

export function normalizeAdzunaCountry(
  raw: string | null | undefined,
  fallback: AdzunaCountryCode = 'gb',
): AdzunaCountryCode {
  const lower = (raw?.trim() || fallback).toLowerCase();
  const aliased = ALIASES[lower] ?? lower;
  return (ADZUNA_COUNTRY_CODES as readonly string[]).includes(aliased)
    ? (aliased as AdzunaCountryCode)
    : fallback;
}

export function isAdzunaCountryCode(code: string): code is AdzunaCountryCode {
  return (ADZUNA_COUNTRY_CODES as readonly string[]).includes(
    code.toLowerCase(),
  );
}
