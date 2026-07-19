/**
 * Normalize messy resume/LLM date strings to YYYY-MM or YYYY-MM-DD.
 * Returns null for empty / "Present" / current; undefined only when input is undefined.
 * Unparseable values are returned trimmed so Zod can reject them.
 */
const PRESENT_RE =
  /^(present|current|now|ongoing|today|tbd|n\/?a|none|-|–|—|\.+)$/i;

const MONTH_NAME_TO_NUM: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

function pad2(n: string | number): string {
  return String(n).padStart(2, '0');
}

function isPlausibleYear(y: number): boolean {
  return y >= 1950 && y <= 2100;
}

function isPlausibleMonth(m: number): boolean {
  return m >= 1 && m <= 12;
}

function isPlausibleDay(d: number): boolean {
  return d >= 1 && d <= 31;
}

function formatYm(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Parse "Jan 2020", "January 2020", "2020 Jan", "Jan 15, 2020", etc. */
function fromMonthName(raw: string): string | null {
  const m1 = raw.match(
    /^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/,
  );
  if (m1) {
    const month = MONTH_NAME_TO_NUM[m1[1].toLowerCase()];
    const day = Number(m1[2]);
    const year = Number(m1[3]);
    if (month && isPlausibleYear(year) && isPlausibleDay(day)) {
      return formatYmd(year, Number(month), day);
    }
  }

  const m2 = raw.match(/^([A-Za-z]+)\.?\s+(\d{4})$/);
  if (m2) {
    const month = MONTH_NAME_TO_NUM[m2[1].toLowerCase()];
    const year = Number(m2[2]);
    if (month && isPlausibleYear(year)) {
      return formatYm(year, Number(month));
    }
  }

  const m3 = raw.match(/^(\d{4})\s+([A-Za-z]+)\.?$/);
  if (m3) {
    const year = Number(m3[1]);
    const month = MONTH_NAME_TO_NUM[m3[2].toLowerCase()];
    if (month && isPlausibleYear(year)) {
      return formatYm(year, Number(month));
    }
  }

  return null;
}

export function normalizeResumeDate(
  value: unknown,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value === 'number') {
    if (Number.isInteger(value) && isPlausibleYear(value)) {
      return formatYm(value, 1);
    }
    return String(value);
  }

  if (typeof value !== 'string') {
    return String(value);
  }

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (PRESENT_RE.test(trimmed)) return null;

  // Already canonical
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(trimmed)) {
    return trimmed;
  }

  // ISO / datetime: 2020-01-15T00:00:00.000Z
  const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  if (iso) return iso[1];

  // Year only: 2020
  if (/^\d{4}$/.test(trimmed)) {
    const year = Number(trimmed);
    if (isPlausibleYear(year)) return formatYm(year, 1);
  }

  // Unpadded: 2020-1 or 2020-1-5
  const unpadded = trimmed.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (unpadded) {
    const year = Number(unpadded[1]);
    const month = Number(unpadded[2]);
    const day = unpadded[3] !== undefined ? Number(unpadded[3]) : undefined;
    if (isPlausibleYear(year) && isPlausibleMonth(month)) {
      if (day !== undefined) {
        if (isPlausibleDay(day)) return formatYmd(year, month, day);
      } else {
        return formatYm(year, month);
      }
    }
  }

  // Slash: 2020/01, 2020/01/15, 01/2020, 01/15/2020
  const ymdSlash = trimmed.match(/^(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?$/);
  if (ymdSlash) {
    const year = Number(ymdSlash[1]);
    const month = Number(ymdSlash[2]);
    const day = ymdSlash[3] !== undefined ? Number(ymdSlash[3]) : undefined;
    if (isPlausibleYear(year) && isPlausibleMonth(month)) {
      if (day !== undefined) {
        if (isPlausibleDay(day)) return formatYmd(year, month, day);
      } else {
        return formatYm(year, month);
      }
    }
  }

  const mySlash = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (mySlash) {
    const month = Number(mySlash[1]);
    const year = Number(mySlash[2]);
    if (isPlausibleYear(year) && isPlausibleMonth(month)) {
      return formatYm(year, month);
    }
  }

  const mdySlash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdySlash) {
    const month = Number(mdySlash[1]);
    const day = Number(mdySlash[2]);
    const year = Number(mdySlash[3]);
    if (
      isPlausibleYear(year) &&
      isPlausibleMonth(month) &&
      isPlausibleDay(day)
    ) {
      return formatYmd(year, month, day);
    }
  }

  const named = fromMonthName(trimmed);
  if (named) return named;

  // Range leftovers sometimes land in a single field ("2018–2020") — take the start year.
  const range = trimmed.match(/^(\d{4})\s*[-–—/]\s*(\d{4}|present|current)$/i);
  if (range) {
    const year = Number(range[1]);
    if (isPlausibleYear(year)) return formatYm(year, 1);
  }

  return trimmed;
}
