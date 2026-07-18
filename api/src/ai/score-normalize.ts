/** Coerce LLM score values to integers in 0–100 (handles 0–1 fractions and floats). */
export function toIntScore(value: unknown): number {
  let num = Number(value);
  if (Number.isNaN(num)) {
    return Number.NaN;
  }
  if (num > 0 && num <= 1) {
    num *= 100;
  }
  return Math.round(Math.min(100, Math.max(0, num)));
}

export function toStringArray(value: unknown, max = 30): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, max);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()].slice(0, max);
  }
  return [];
}

export function toNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, val] of Object.entries(value)) {
    const num = toIntScore(val);
    if (!Number.isNaN(num)) {
      out[key] = num;
    }
  }
  return out;
}
