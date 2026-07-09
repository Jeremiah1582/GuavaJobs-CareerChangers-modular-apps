import { AtsType } from './types/unified-job.types';

export function buildCanonicalKey(
  atsType: AtsType,
  board: string,
  jobId: string,
): string {
  return `${atsType}:${board}:${jobId}`.toLowerCase();
}

export function buildAdzunaKey(country: string, adzunaId: string): string {
  return buildCanonicalKey('adzuna', country.toLowerCase(), adzunaId);
}

export function parseCanonicalKey(key: string): {
  atsType: string;
  board: string;
  jobId: string;
} | null {
  const decoded = decodeURIComponent(key).trim();
  const parts = decoded.split(':');
  if (parts.length < 3) {
    return null;
  }
  return {
    atsType: parts[0]!,
    board: parts.slice(1, -1).join(':'),
    jobId: parts[parts.length - 1]!,
  };
}
