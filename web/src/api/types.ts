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
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  breakdown: Record<string, number>;
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
