import {
  normalizeAdzunaCountry,
  type AdzunaCountryCode,
} from "@/lib/adzuna-countries";
import type { JobListItem } from "@/api/types";

/** Encode canonical keys for URL paths (colons → %3A). */
export function jobDetailPath(canonicalKey: string): string {
  return `/app/jobs/${encodeURIComponent(canonicalKey)}`;
}

export function decodeJobKey(param: string): string {
  return decodeURIComponent(param);
}

const PLACEHOLDER_TITLES = new Set(["job seeker"]);

export type JobSearchDefaults = {
  q: string;
  location: string;
  /** Lowercase Adzuna country code (e.g. gb, de, ie). */
  country: AdzunaCountryCode;
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
  const country = normalizeAdzunaCountry(profile.locationCountry);

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

  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

/** Infer workplace type from free-text location (no API remote filter yet). */
export function inferWorkplace(
  location: string | null | undefined,
): "Remote" | "Hybrid" | null {
  const loc = (location ?? "").toLowerCase();
  if (!loc) return null;
  if (/\bremote\b|\banywhere\b|\bwfh\b|\bwork from home\b/.test(loc)) {
    return "Remote";
  }
  if (/\bhybrid\b/.test(loc)) return "Hybrid";
  return null;
}

export function atsTypeLabel(
  atsType: JobListItem["atsType"] | string | undefined,
): string | null {
  switch (atsType) {
    case "greenhouse":
      return "Greenhouse";
    case "lever":
      return "Lever";
    case "ashby":
      return "Ashby";
    case "adzuna":
      return "Adzuna";
    default:
      return null;
  }
}

export function normalizeAtsType(
  value: string | null | undefined,
): JobListItem["atsType"] {
  if (
    value === "greenhouse" ||
    value === "lever" ||
    value === "ashby" ||
    value === "adzuna"
  ) {
    return value;
  }
  return "unknown";
}

/** Map a thin SavedJob pointer to a list card (no full JD). */
export function savedJobToListItem(saved: {
  canonicalKey: string;
  title: string | null;
  company: string | null;
  location: string | null;
  atsType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  resolveStatus: "LIVE" | "GONE" | "UNKNOWN";
}): JobListItem {
  return {
    canonicalKey: saved.canonicalKey,
    title: saved.title?.trim() || "Saved role",
    company: saved.company?.trim() || "Unknown company",
    location: saved.location,
    snippet:
      saved.resolveStatus === "GONE"
        ? "This listing is no longer available — unheart or keep for your records."
        : "",
    // Detail panel re-fetches live; placeholder satisfies JobListItem shape.
    applyUrl: "https://guavajobs.local/saved",
    atsType: normalizeAtsType(saved.atsType),
    hasFullDescription: false,
    applyType: "unknown",
    salaryMin: saved.salaryMin,
    salaryMax: saved.salaryMax,
    salaryCurrency: saved.salaryCurrency,
  };
}
