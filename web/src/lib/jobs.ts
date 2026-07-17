/** Encode canonical keys for URL paths (colons → %3A). */
export function jobDetailPath(canonicalKey: string): string {
  return `/app/jobs/${encodeURIComponent(canonicalKey)}`;
}

export function decodeJobKey(param: string): string {
  return decodeURIComponent(param);
}

export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency?: string | null,
): string | null {
  if (min == null && max == null) return null;
  const cur = currency ?? "GBP";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);

  if (min != null && max != null) return `${fmt(min)} to ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}
