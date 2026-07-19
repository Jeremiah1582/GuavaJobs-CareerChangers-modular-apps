import type {
  ProfileIndustry,
  SeniorityLevel,
} from "@/lib/onboarding";

export type MeResponse = {
  id: string;
  email: string;
  name: string;
  tier: string;
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
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  postedAt?: string | null;
};

export type JobSearchResponse = {
  results: JobListItem[];
  page: number;
  totalResults: number;
  attribution: "Jobs by Adzuna";
};

export type UnifiedJob = JobListItem & {
  description: string;
  source: "adzuna";
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
  actionableSteps: string[];
  keywordCoverage: Record<string, number>;
  icpMatch: Record<string, unknown>;
  breakdown: Record<string, number>;
  assessedAt: string;
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

export function isGeneratingStatus(
  status: GenerationStatus | null | undefined,
): boolean {
  return status === "PENDING" || status === "PROCESSING";
}
