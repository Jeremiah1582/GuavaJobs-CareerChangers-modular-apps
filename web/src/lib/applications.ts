import type {
  ApplicationEvent,
  ApplicationResponse,
  ApplicationStatus,
} from "@/api/types";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "DRAFT",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "OFFER_ACCEPTED",
  "OFFER_DECLINED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
  "ARCHIVED",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  OFFER_ACCEPTED: "Offer accepted",
  OFFER_DECLINED: "Offer declined",
  HIRED: "Hired",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ARCHIVED: "Archived",
};

/** Cookie: default home = tracker once the user has ≥1 application. */
export const HAS_APPS_COOKIE = "gj_has_applications";

export function setHasApplicationsCookie(hasApps: boolean): void {
  if (typeof document === "undefined") return;
  if (hasApps) {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${HAS_APPS_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } else {
    document.cookie = `${HAS_APPS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function applicationTitle(app: ApplicationResponse): string {
  if (app.jobRoleTitle) return app.jobRoleTitle;
  const snap = app.jobSnapshot;
  if (snap && typeof snap.title === "string") return snap.title;
  return "Untitled role";
}

export function applicationCompany(app: ApplicationResponse): string | null {
  if (app.companyName) return app.companyName;
  const snap = app.jobSnapshot;
  if (snap && typeof snap.company === "string") return snap.company;
  return null;
}

function snapshotDescription(
  jobSnapshot: Record<string, unknown> | null,
): string {
  if (!jobSnapshot) return "";
  const d = jobSnapshot.description;
  return typeof d === "string" ? d : "";
}

function snapshotSnippet(
  jobSnapshot: Record<string, unknown> | null,
): string {
  if (!jobSnapshot) return "";
  const s = jobSnapshot.snippet;
  return typeof s === "string" ? s : "";
}

/** Prefer pasted full text, then snapshot description, then short listing snippet. */
export function effectiveJobDescription(app: ApplicationResponse): string {
  const pasted = (app.pastedJobDescription ?? "").trim();
  if (pasted) return pasted;
  const fromSnap = snapshotDescription(app.jobSnapshot).trim();
  if (fromSnap) return fromSnap;
  return snapshotSnippet(app.jobSnapshot).trim();
}

/** True when we have full listing text — not Adzuna/snippet-only. */
export function hasFullJobDescription(app: ApplicationResponse): boolean {
  if ((app.pastedJobDescription ?? "").trim()) return true;
  return snapshotDescription(app.jobSnapshot).trim().length > 0;
}

/** Green band on fit score rings — good enough to apply with confidence. */
export const ATS_GOOD_SCORE_MIN = 70;

export function latestNextStep(
  events: ApplicationEvent[] | undefined,
): ApplicationEvent | null {
  if (!events?.length) return null;
  return (
    events.find((e) => e.eventType === "NEXT_STEP") ?? null
  );
}

export function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
