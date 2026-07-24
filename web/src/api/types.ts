import type {
  ProfileIndustry,
  SeniorityLevel,
} from "@/lib/onboarding";

/** User.metadata preferences returned/accepted by GET/PATCH /me */
export type UserPreferences = {
  /** When true, package generate also builds GeneratedCv. Default false. */
  autoGenerateTailoredCv?: boolean;
};

export type PlatformRole = "USER" | "ADMIN" | "OWNER";

export type MeResponse = {
  id: string;
  email: string;
  name: string;
  tier: string;
  platformRole: PlatformRole;
  defaultProfileId: string | null;
  defaultProfile: {
    id: string;
    profileTitle: string;
    jobTitle: string;
    isDefault: boolean;
  } | null;
  usage: {
    tier: string;
    aiGenerationsUsedPeriod: number;
    aiGenerationsLimit: number | null;
  };
  /** Typed preferences from User.metadata (absent keys → defaults). */
  preferences?: UserPreferences;
};

export type PatchMeBody = {
  name?: string;
  imgUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  preferences?: UserPreferences;
};

export type CvMeta = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  parseStatus: "PENDING" | "READY" | "FAILED";
  uploadedAt: string;
};

export type ProfileResponse = {
  id: string;
  profileTitle: string;
  jobTitle: string;
  seniority: SeniorityLevel;
  primaryIndustry: ProfileIndustry;
  currentCvId: string | null;
  skills?: string[];
  summary?: string | null;
  locationCity?: string | null;
  locationCountry?: string | null;
};

export type ProfileDetail = ProfileResponse & {
  currentCv: CvMeta | null;
  generalAtsAssessment: ProfileAtsAssessment | null;
};

export type ProfileAtsAssessment = {
  profileId: string;
  industry: ProfileIndustry;
  cvDocumentId?: string | null;
  score: number;
  summary?: string | null;
  missingKeywords: string[];
  suggestions: string[];
  strengths?: string[];
  priorityActions?: Array<{
    title: string;
    detail: string;
    impact: "high" | "medium" | "low";
  }>;
  checklist?: Array<{
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }>;
  breakdown: Record<string, number>;
  inputFingerprint?: string | null;
  assessedAt: string;
};

export type CvUploadResponse = {
  profileId: string;
  currentCvId: string;
  cv: CvMeta;
};

export type CreateOrPatchProfileBody = {
  profileTitle?: string;
  jobTitle?: string;
  seniority?: SeniorityLevel;
  primaryIndustry?: ProfileIndustry;
  summary?: string;
  isDefault?: boolean;
};

export type JobListItem = {
  canonicalKey: string;
  title: string;
  company: string;
  location: string | null;
  snippet: string;
  applyUrl: string;
  atsType: "greenhouse" | "lever" | "ashby" | "adzuna" | "unknown";
  hasFullDescription: boolean;
  applyType: "url" | "unknown";
  source?: "adzuna" | "ats_direct";
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  postedAt?: string | null;
};

export type JobSearchResponse = {
  results: JobListItem[];
  page: number;
  totalResults: number;
  attribution: "Jobs by Adzuna" | "Company career pages";
};

export type SavedJobResolveStatus = "LIVE" | "GONE" | "UNKNOWN";

export type SavedJobResponse = {
  id: string;
  canonicalKey: string;
  savedAt: string;
  title: string | null;
  company: string | null;
  location: string | null;
  atsType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  lastResolvedAt: string | null;
  resolveStatus: SavedJobResolveStatus;
};

export type SavedJobsListResponse = {
  results: SavedJobResponse[];
};

export type SavedJobKeysResponse = {
  canonicalKeys: string[];
};

export type SaveJobBody = {
  canonicalKey: string;
  title?: string;
  company?: string;
  location?: string | null;
  atsType?: JobListItem["atsType"];
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
};

export type UnifiedJob = JobListItem & {
  description: string;
  source: "adzuna" | "ats_direct";
  fetchedAt: string;
  adzunaId?: string;
  adzunaCountry?: string;
};

export type GenerationStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type ApplicationAtsReport = {
  score: number;
  letterScore?: number | null;
  cvScore?: number | null;
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  gaps: string[];
  /** Optional taxonomy for UX routing; gaps remains the compat list. */
  gapsDetailed?: Array<{
    text: string;
    kind: "keyword" | "evidence" | "cert" | "domain" | "seniority";
  }>;
  actionableSteps: string[];
  /** Roles the CV supports today — useful when this JD is a poor fit. */
  suggestedRoles?: string[];
  /** One-sentence career guidance grounded in suggestedRoles. */
  careerSuggestion?: string | null;
  /** 1–2 sentences on how fit moved after a refresh. */
  changeSummary?: string | null;
  keywordCoverage: Record<string, number>;
  icpMatch: Record<string, unknown>;
  breakdown: Record<string, number>;
  assessedAt: string;
  /** JD / letter / CV changed since this report was scored. */
  stale?: boolean;
};

/** POST /applications/:id/gaps/address — save a gap fill into the master career corpus. */
export type AddressApplicationGapBody = {
  gapText: string;
  answer: string;
  section?: string;
};

/** POST /applications/:id/gaps/improve — facts-only polish of a micro-form draft (AI quota). */
export type ImproveApplicationGapBody = {
  gapText: string;
  /** Composed micro-form text (Role / Dates / Details / Outcome). */
  draft: string;
  missingKeywords?: string[];
};

export type ImproveApplicationGapResponse = {
  improvedAnswer: string;
  factsUsed: string[];
  warnings?: string[];
};

export type CareerGapEnrichment = {
  gapText: string;
  answer: string;
  section?: string;
  createdAt: string;
};

export type ApplicationStatus =
  | "DRAFT"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "OFFER_ACCEPTED"
  | "OFFER_DECLINED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN"
  | "ARCHIVED";

export type ApplicationEventType =
  | "RESPONSE"
  | "INTERVIEW"
  | "NOTE"
  | "NEXT_STEP"
  | "STATUS_CHANGE";

export type ApplicationEvent = {
  id: string;
  eventType: ApplicationEventType;
  occurredAt: string;
  content: string;
  contactName: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type ApplicationCvChoice = "UPLOADED" | "GENERATED";

export type GeneratedCvWorkEntry = {
  position: string;
  name: string;
  location?: string | null;
  startDate: string | null;
  endDate: string | null;
  highlights: string[];
  summary?: string;
};

export type GeneratedCvContent = {
  label?: string | null;
  summary?: string | null;
  coreCompetencies: string[];
  work: GeneratedCvWorkEntry[];
  education: Array<{
    institution: string;
    studyType?: string | null;
    area?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  skills: Array<{ name: string; keywords?: string[] }>;
  certificates: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  languages: Array<{ language: string; fluency?: string | null }>;
  awards: Array<Record<string, unknown>>;
  volunteer: Array<Record<string, unknown>>;
  meta: {
    schemaVersion: string;
    tailoredFor?: string;
    generatedAt: string;
  };
};

export type GeneratedCvResponse = {
  id: string;
  content: GeneratedCvContent;
  edited: boolean;
  templateId: string;
  sourceCvDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedCvExport = GeneratedCvContent & {
  basics: {
    name: string;
    email: string;
    phone: string | null;
    label: string;
    location?: { city: string | null; country: string | null };
    profiles: Array<{ network: string; url: string }>;
  };
};

export type ApplicationResponse = {
  id: string;
  userId: string;
  profileId: string;
  status: ApplicationStatus | string;
  generationMode: "AI" | "MANUAL";
  canonicalJobKey: string | null;
  applyUrl: string | null;
  generationStatus: GenerationStatus | null;
  generationError: string | null;
  jobSnapshot: Record<string, unknown> | null;
  profileSnapshot: Record<string, unknown> | null;
  cvSnapshot: Record<string, unknown> | null;
  pastedJobDescription?: string | null;
  companyName: string | null;
  jobRoleTitle: string | null;
  jobLocation?: string | null;
  sourceOfListing?: string | null;
  industry?: string | null;
  coverLetterContent: string | null;
  coverLetterTemplateId: string;
  coverLetterSource: "AI" | "MANUAL";
  coverLetterEdited: boolean;
  cvChoice: ApplicationCvChoice;
  generatedCv?: GeneratedCvResponse | null;
  generatedCvExport?: GeneratedCvExport | null;
  appliedAt?: string | null;
  atsReport: ApplicationAtsReport | null;
  /** Saved gap-fill answers on the profile master career corpus. */
  careerEnrichments?: CareerGapEnrichment[];
  events?: ApplicationEvent[];
  createdAt: string;
  updatedAt: string;
};

export type CreateManualApplicationBody = {
  profileId: string;
  canonicalJobKey?: string;
  companyName?: string;
  jobRoleTitle?: string;
  jobLocation?: string;
  jobWebsite?: string;
  industry?: string;
  sourceOfListing?: string;
  applyUrl?: string;
  pastedJobDescription?: string;
  status?: ApplicationStatus;
};

export type MarketFitResponse = {
  profileId: string;
  regionCountry: string;
  currency: string;
  generatedAt: string;
  inputFingerprint: string;
  stale?: boolean;
  paywall: {
    enabled: boolean;
    message: string | null;
  };
  roles: Array<{
    title: string;
    fitLevel: "strong" | "adjacent" | "stretch";
    matchScore?: number;
    whyFit: string;
    evidenceSkills: string[];
    salary: {
      min: number;
      max: number;
      median?: number;
      period: "year";
      currency: string;
      source: "ons_ashe" | "eurosalary";
      label: string;
    } | null;
    searchCta: {
      q: string;
      country: string;
      location?: string;
    };
  }>;
  attribution: string[];
};

export function isGeneratingStatus(
  status: GenerationStatus | null | undefined,
): boolean {
  return status === "PENDING" || status === "PROCESSING";
}

/**
 * Adaptive poll interval while package generation is in flight.
 * Fast early (catch quick completes), then back off — keep polling up to ~10 min.
 */
export function generationPollIntervalMs(elapsedMs: number): number {
  if (elapsedMs < 15_000) return 1_500;
  if (elapsedMs < 120_000) return 3_000;
  if (elapsedMs < 300_000) return 5_000;
  return 8_000;
}

/** UI: normal expectation before "background" copy kicks in. */
export const GENERATION_BACKGROUND_HINT_MS = 120_000;

/** UI: offer manual retry if still in-flight after this long. */
export const GENERATION_STUCK_UI_MS = 300_000;

export type EngagementSummary = {
  signups: {
    total: number;
    series: Array<{ date: string; count: number }>;
  };
  peaks: {
    weekday: { day: number; label: string; count: number };
    dayOfMonth: { day: number; count: number };
  };
  sessions: {
    avgDurationMs: number | null;
    totalEnded: number;
  };
  topRegions: Array<{
    country: string;
    searches: number;
    logins: number;
    total: number;
  }>;
  topSearchTerms: Array<{ term: string; count: number }>;
  topIndustries: Array<{ industry: string; count: number }>;
};

export type AdminEngagementUser = {
  id: string;
  name: string;
  tier: string;
  platformRole: PlatformRole;
  region: string | null;
  joinedAt: string;
  lastActiveAt: string | null;
};

export type AdminOwnerUser = AdminEngagementUser & {
  email: string;
};

export type AdminEngagementUsersResponse = {
  results: AdminEngagementUser[];
  page: number;
  limit: number;
  total: number;
};

export type AdminOwnerUsersResponse = {
  results: AdminOwnerUser[];
  page: number;
  limit: number;
  total: number;
};
