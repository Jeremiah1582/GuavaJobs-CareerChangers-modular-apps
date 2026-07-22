/**
 * Profile completeness — single client source of truth (M4.5.2).
 * Distinct from application ProgressRing (draft readiness on review desk).
 */

export const COMPLETENESS_SECTIONS = [
  {
    id: "role",
    label: "Target role",
    tip: "Add a job title so letters match the role you want.",
  },
  {
    id: "industry",
    label: "Industry",
    tip: "Pick your primary industry for better ATS coaching.",
  },
  {
    id: "seniority",
    label: "Seniority",
    tip: "Set seniority so fit scores match your level.",
  },
  {
    id: "skills",
    label: "Skills",
    /** Soft-gate copy used on Generate — never hard-block. */
    tip: "Add skills for stronger letters",
  },
  {
    id: "location",
    label: "Location",
    tip: "Add a city so Market Fit and search feel local.",
  },
  {
    id: "cv",
    label: "CV ready",
    tip: "Upload a CV and wait until parsing finishes.",
  },
] as const;

export type CompletenessSectionId = (typeof COMPLETENESS_SECTIONS)[number]["id"];

export type CompletenessInput = {
  jobTitle?: string | null;
  primaryIndustry?: string | null;
  seniority?: string | null;
  skills?: string[] | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  currentCvId?: string | null;
  parseStatus?: "PENDING" | "READY" | "FAILED" | null;
};

export type CompletenessSectionResult = {
  id: CompletenessSectionId;
  label: string;
  tip: string;
  done: boolean;
};

export type CompletenessResult = {
  percent: number;
  doneCount: number;
  total: number;
  sections: CompletenessSectionResult[];
  missing: CompletenessSectionResult[];
  /** Best soft-gate tip for Generate (skills preferred). Null when complete. */
  softGateTip: string | null;
};

const MIN_SKILLS = 3;

function hasText(value: string | null | undefined, min = 1): boolean {
  return (value ?? "").trim().length >= min;
}

function sectionDone(
  id: CompletenessSectionId,
  input: CompletenessInput,
): boolean {
  switch (id) {
    case "role":
      return hasText(input.jobTitle, 2);
    case "industry":
      return hasText(input.primaryIndustry);
    case "seniority":
      return hasText(input.seniority);
    case "skills":
      return (input.skills ?? []).filter((s) => s.trim().length > 0).length >=
        MIN_SKILLS;
    case "location":
      return hasText(input.locationCity, 2) || hasText(input.locationCountry, 2);
    case "cv":
      return input.parseStatus === "READY" && !!input.currentCvId;
    default:
      return false;
  }
}

/**
 * Compute profile completeness from saved profile fields + CV parse status.
 */
export function computeCompleteness(
  input: CompletenessInput,
): CompletenessResult {
  const sections: CompletenessSectionResult[] = COMPLETENESS_SECTIONS.map(
    (s) => ({
      id: s.id,
      label: s.label,
      tip: s.tip,
      done: sectionDone(s.id, input),
    }),
  );
  const doneCount = sections.filter((s) => s.done).length;
  const total = sections.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const missing = sections.filter((s) => !s.done);

  const skillsMissing = missing.find((s) => s.id === "skills");
  const softGateTip = skillsMissing
    ? skillsMissing.tip
    : (missing[0]?.tip ?? null);

  return { percent, doneCount, total, sections, missing, softGateTip };
}

/**
 * Live draft while editing the profile form (same formula as saved profile).
 */
export function computeCompletenessFromDraft(
  draft: CompletenessInput,
): CompletenessResult {
  return computeCompleteness(draft);
}
