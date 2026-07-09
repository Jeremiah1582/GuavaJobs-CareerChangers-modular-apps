import { Injectable } from '@nestjs/common';
import { UnifiedJob } from '../shared/schemas/job.schema';

export type ParsedJobFacts = {
  companyName: string | null;
  jobRoleTitle: string | null;
  jobLocation: string | null;
  jobWebsite: string | null;
  industry: string | null;
  sourceOfListing: string;
  languageRequired: string[];
  jobSalaryMin: number | null;
  jobSalaryMax: number | null;
  jobSalaryCurrency: string | null;
  jobSalaryPeriod: 'ANNUAL' | 'MONTHLY' | 'HOURLY' | null;
  jobSalaryRaw: string | null;
};

@Injectable()
export class JobFactsParser {
  parseFromJob(job: UnifiedJob): ParsedJobFacts {
    return {
      companyName: job.company || null,
      jobRoleTitle: job.title || null,
      jobLocation: job.location,
      jobWebsite: null,
      industry: null,
      sourceOfListing: 'Adzuna',
      languageRequired: [],
      jobSalaryMin: job.salaryMin ?? null,
      jobSalaryMax: job.salaryMax ?? null,
      jobSalaryCurrency: job.salaryCurrency ?? null,
      jobSalaryPeriod: null,
      jobSalaryRaw:
        job.salaryMin || job.salaryMax
          ? `${job.salaryMin ?? ''}-${job.salaryMax ?? ''} ${job.salaryCurrency ?? ''}`.trim()
          : null,
    };
  }

  parseFromFreeText(description: string, overrides?: Partial<ParsedJobFacts>): ParsedJobFacts {
    const languages = extractLanguages(description);
    return {
      companyName: overrides?.companyName ?? null,
      jobRoleTitle: overrides?.jobRoleTitle ?? null,
      jobLocation: overrides?.jobLocation ?? null,
      jobWebsite: overrides?.jobWebsite ?? null,
      industry: overrides?.industry ?? null,
      sourceOfListing: overrides?.sourceOfListing ?? 'Manual',
      languageRequired: overrides?.languageRequired ?? languages,
      jobSalaryMin: overrides?.jobSalaryMin ?? null,
      jobSalaryMax: overrides?.jobSalaryMax ?? null,
      jobSalaryCurrency: overrides?.jobSalaryCurrency ?? null,
      jobSalaryPeriod: overrides?.jobSalaryPeriod ?? null,
      jobSalaryRaw: overrides?.jobSalaryRaw ?? null,
    };
  }
}

function extractLanguages(text: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /\b(english|french|german|spanish|dutch|italian|portuguese)\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match[1]) {
        found.add(match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase());
      }
    }
  }
  return [...found];
}
