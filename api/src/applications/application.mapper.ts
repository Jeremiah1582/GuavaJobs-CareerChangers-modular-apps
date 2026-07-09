import {
  Application,
  ApplicationAtsReport,
  ApplicationEvent,
  ApplicationGenerationStatus,
} from '@prisma/client';
import { ApplicationResponse } from '../shared/schemas/application.schema';

type ApplicationWithRelations = Application & {
  atsReport?: ApplicationAtsReport | null;
  events?: ApplicationEvent[];
};

export function toApplicationResponse(
  app: ApplicationWithRelations,
  includeEvents = false,
): ApplicationResponse {
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
    appliedAt: app.appliedAt?.toISOString() ?? null,
    atsReport: app.atsReport ? toAtsReportResponse(app.atsReport) : null,
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

function toAtsReportResponse(report: ApplicationAtsReport) {
  return {
    score: report.score,
    letterScore: report.letterScore,
    cvScore: report.cvScore,
    missingKeywords: jsonStringArray(report.missingKeywords),
    suggestions: jsonStringArray(report.suggestions),
    strengths: jsonStringArray(report.strengths),
    gaps: jsonStringArray(report.gaps),
    actionableSteps: jsonStringArray(report.actionableSteps),
    keywordCoverage: jsonNumberRecord(report.keywordCoverage),
    icpMatch: jsonRecord(report.icpMatch) ?? {},
    breakdown: jsonNumberRecord(report.breakdown),
    assessedAt: report.assessedAt.toISOString(),
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
