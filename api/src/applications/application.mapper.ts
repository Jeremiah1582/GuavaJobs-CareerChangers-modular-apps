import {
  Application,
  ApplicationAtsReport,
  ApplicationEvent,
  ApplicationGenerationStatus,
  GeneratedCv,
  Profile,
  User,
} from '@prisma/client';
import { ApplicationResponse } from '../shared/schemas/application.schema';
import {
  GeneratedCvStoredContent,
  generatedCvStoredContentSchema,
  hydrateGeneratedCvContent,
} from '../shared/schemas/generated-cv.schema';
import {
  buildApplicationAtsFingerprint,
  resolveCvTextForAts,
  resolveJobDescriptionForAts,
  serializeCareerContent,
} from './application-ats.fingerprint';

type ApplicationWithRelations = Application & {
  atsReport?: ApplicationAtsReport | null;
  events?: ApplicationEvent[];
  generatedCv?: GeneratedCv | null;
  user?: User | null;
  profile?:
    | (Profile & {
        currentCv?: { parsedText: string | null } | null;
        careerCv?: { content: unknown } | null;
      })
    | null;
};

export function toApplicationResponse(
  app: ApplicationWithRelations,
  includeEvents = false,
): ApplicationResponse {
  // Never let a bad GeneratedCv JSON take down list/detail — fall back to null.
  let storedContent: GeneratedCvStoredContent | null = null;
  if (app.generatedCv) {
    try {
      storedContent = parseStoredCvContent(app.generatedCv.content);
    } catch {
      storedContent = null;
    }
  }

  const generatedCv =
    app.generatedCv && storedContent
      ? {
          id: app.generatedCv.id,
          content: storedContent,
          edited: app.generatedCv.edited,
          templateId: app.generatedCv.templateId,
          sourceCvDocumentId: app.generatedCv.sourceCvDocumentId,
          createdAt: app.generatedCv.createdAt.toISOString(),
          updatedAt: app.generatedCv.updatedAt.toISOString(),
        }
      : null;

  let generatedCvExport: ApplicationResponse['generatedCvExport'] = null;
  if (storedContent && app.user && app.profile) {
    try {
      generatedCvExport = hydrateGeneratedCvContent(
        storedContent,
        buildBasics(app.user, app.profile, storedContent),
      );
    } catch {
      generatedCvExport = null;
    }
  }

  return {
    id: app.id,
    userId: app.userId,
    profileId: app.profileId,
    status: app.status,
    generationMode: app.generationMode,
    canonicalJobKey: app.canonicalJobKey,
    applyUrl: app.applyUrl,
    generationStatus: app.generationStatus,
    generationError: app.generationError,
    jobSnapshot: jsonRecord(app.jobSnapshot),
    profileSnapshot: jsonRecord(app.profileSnapshot),
    cvSnapshot: jsonRecord(app.cvSnapshot),
    snapshottedAt: app.snapshottedAt.toISOString(),
    pastedJobDescription: app.pastedJobDescription,
    companyName: app.companyName,
    jobRoleTitle: app.jobRoleTitle,
    jobLocation: app.jobLocation,
    jobWebsite: app.jobWebsite,
    industry: app.industry,
    sourceOfListing: app.sourceOfListing,
    languageRequired: app.languageRequired,
    jobStartDate: app.jobStartDate?.toISOString() ?? null,
    jobSalaryMin: app.jobSalaryMin,
    jobSalaryMax: app.jobSalaryMax,
    jobSalaryCurrency: app.jobSalaryCurrency,
    jobSalaryPeriod: app.jobSalaryPeriod,
    jobSalaryRaw: app.jobSalaryRaw,
    userFitRating: app.userFitRating,
    coverLetterContent: app.coverLetterContent,
    coverLetterTemplateId: app.coverLetterTemplateId,
    coverLetterSource: app.coverLetterSource,
    coverLetterEdited: app.coverLetterEdited,
    cvChoice: app.cvChoice,
    generatedCv,
    generatedCvExport,
    appliedAt: app.appliedAt?.toISOString() ?? null,
    atsReport: app.atsReport
      ? toAtsReportResponse(app.atsReport, isAtsReportStale(app))
      : null,
    events: includeEvents
      ? (app.events ?? []).map((e) => ({
          id: e.id,
          eventType: e.eventType,
          occurredAt: e.occurredAt.toISOString(),
          content: e.content,
          contactName: e.contactName,
          createdAt: e.createdAt.toISOString(),
        }))
      : undefined,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildBasics(
  user: Pick<User, 'name' | 'email' | 'linkedinUrl' | 'githubUrl'>,
  profile: Pick<
    Profile,
    'jobTitle' | 'contactPhone' | 'locationCity' | 'locationCountry'
  >,
  content: GeneratedCvStoredContent,
) {
  const profiles: { network: string; url: string }[] = [];
  if (user.linkedinUrl && isHttpUrl(user.linkedinUrl)) {
    profiles.push({ network: 'LinkedIn', url: user.linkedinUrl });
  }
  if (user.githubUrl && isHttpUrl(user.githubUrl)) {
    profiles.push({ network: 'GitHub', url: user.githubUrl });
  }

  return {
    name: user.name,
    email: user.email,
    phone: profile.contactPhone,
    label: content.label ?? profile.jobTitle,
    location: {
      city: profile.locationCity,
      country: profile.locationCountry,
    },
    profiles,
  };
}

function parseStoredCvContent(raw: unknown): GeneratedCvStoredContent {
  // Tolerate accidental wrapper from older worker builds: { content: { ... } }
  if (
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    'content' in raw &&
    (raw as { content: unknown }).content &&
    typeof (raw as { content: unknown }).content === 'object' &&
    !Array.isArray((raw as { content: unknown }).content)
  ) {
    return generatedCvStoredContentSchema.parse(
      (raw as { content: unknown }).content,
    );
  }
  return generatedCvStoredContentSchema.parse(raw);
}

function isAtsReportStale(app: ApplicationWithRelations): boolean {
  if (!app.atsReport) return false;
  const stored = app.atsReport.inputFingerprint;
  if (!stored) {
    // Legacy reports without fingerprint: treat as stale so user can refresh once.
    return true;
  }
  const careerContent = serializeCareerContent(app.profile?.careerCv?.content);
  const current = buildApplicationAtsFingerprint({
    jobDescription: resolveJobDescriptionForAts(app),
    coverLetter: app.coverLetterContent ?? '',
    cvText: resolveCvTextForAts(app),
    cvChoice: app.cvChoice,
    careerContent,
  });
  return current !== stored;
}

function toAtsReportResponse(report: ApplicationAtsReport, stale: boolean) {
  return {
    score: report.score,
    letterScore: report.letterScore,
    cvScore: report.cvScore,
    missingKeywords: jsonStringArray(report.missingKeywords),
    suggestions: jsonStringArray(report.suggestions),
    strengths: jsonStringArray(report.strengths),
    gaps: jsonStringArray(report.gaps),
    actionableSteps: jsonStringArray(report.actionableSteps),
    suggestedRoles: jsonStringArray(report.suggestedRoles),
    careerSuggestion: report.careerSuggestion ?? null,
    keywordCoverage: jsonNumberRecord(report.keywordCoverage),
    icpMatch: jsonRecord(report.icpMatch) ?? {},
    breakdown: jsonNumberRecord(report.breakdown),
    assessedAt: report.assessedAt.toISOString(),
    stale,
  };
}

function jsonRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function jsonNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'number') out[k] = v;
  }
  return out;
}

export function isTerminalGenerationStatus(
  status: ApplicationGenerationStatus | null | undefined,
): boolean {
  return status === 'COMPLETED' || status === 'FAILED';
}

export const applicationDetailInclude = {
  atsReport: true,
  generatedCv: true,
  user: true,
  profile: { include: { currentCv: true, careerCv: true } },
} as const;

export const applicationListInclude = {
  atsReport: true,
  generatedCv: true,
  user: true,
  profile: { include: { currentCv: true, careerCv: true } },
} as const;
