/** Encode canonical keys for URL paths (colons → %3A). */
export function jobDetailPath(canonicalKey: string): string {
  return `/app/jobs/${encodeURIComponent(canonicalKey)}`;
}

export function decodeJobKey(param: string): string {
  return decodeURIComponent(param);
}

const PLACEHOLDER_TITLES = new Set(["job seeker"]);

/** Adzuna uses `gb`; accept common aliases from profile ISO fields. */
const COUNTRY_ALIASES: Record<string, string> = {
  uk: "gb",
};

export type JobSearchDefaults = {
  q: string;
  location: string;
  /** Lowercase Adzuna country code (e.g. gb, de, ie). */
  country: string;
};

/**
 * Build the default job-feed search from the user's default profile.
 * Prefers job title, then profile label; city for `where`; country for Adzuna market.
 */
export function deriveJobSearchDefaults(profile: {
  jobTitle: string;
  profileTitle: string;
  locationCity?: string | null;
  locationCountry?: string | null;
}): JobSearchDefaults {
  const jobTitle = profile.jobTitle.trim();
  const profileTitle = profile.profileTitle.trim();

  let q = "";
  if (jobTitle && !PLACEHOLDER_TITLES.has(jobTitle.toLowerCase())) {
    q = jobTitle;
  } else if (
    profileTitle &&
    !PLACEHOLDER_TITLES.has(profileTitle.toLowerCase())
  ) {
    q = profileTitle;
  }

  const location = profile.locationCity?.trim() ?? "";
  const rawCountry = (profile.locationCountry?.trim() || "gb").toLowerCase();
  const country = COUNTRY_ALIASES[rawCountry] ?? rawCountry;

  return { q, location, country };
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
