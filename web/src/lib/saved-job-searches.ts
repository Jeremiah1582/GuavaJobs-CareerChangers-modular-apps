import { normalizeAdzunaCountry } from "@/lib/adzuna-countries";

export type SavedJobSearch = {
  id: string;
  label: string;
  q: string;
  location: string;
  country: string;
  savedAt: string;
};

const STORAGE_KEY = "guava:saved-job-searches";
const MAX_SAVED = 12;

function searchFingerprint(q: string, location: string, country: string): string {
  return [
    q.trim().toLowerCase(),
    location.trim().toLowerCase(),
    normalizeAdzunaCountry(country),
  ].join("|");
}

export function loadSavedJobSearches(): SavedJobSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedJobSearch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedJobSearches(searches: SavedJobSearch[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches.slice(0, MAX_SAVED)));
}

export function buildSavedSearchLabel(
  q: string,
  location: string,
  country: string,
): string {
  const trimmedQ = q.trim();
  const trimmedLoc = location.trim();
  if (trimmedQ) return trimmedQ;
  if (trimmedLoc) return trimmedLoc;
  return `Search in ${normalizeAdzunaCountry(country).toUpperCase()}`;
}

export function saveJobSearch(input: {
  q: string;
  location: string;
  country: string;
  label?: string;
}): SavedJobSearch[] {
  const q = input.q.trim();
  const location = input.location.trim();
  const country = normalizeAdzunaCountry(input.country);
  const fingerprint = searchFingerprint(q, location, country);

  const existing = loadSavedJobSearches();
  const withoutDup = existing.filter(
    (s) => searchFingerprint(s.q, s.location, s.country) !== fingerprint,
  );

  const entry: SavedJobSearch = {
    id: crypto.randomUUID(),
    label: input.label?.trim() || buildSavedSearchLabel(q, location, country),
    q,
    location,
    country,
    savedAt: new Date().toISOString(),
  };

  const next = [entry, ...withoutDup].slice(0, MAX_SAVED);
  persistSavedJobSearches(next);
  return next;
}

export function removeSavedJobSearch(id: string): SavedJobSearch[] {
  const next = loadSavedJobSearches().filter((s) => s.id !== id);
  persistSavedJobSearches(next);
  return next;
}
