import { AtsFieldMap } from '../shared/schemas/autofill.schema';
import { ashbyFieldMap } from './templates/ashby.fields';
import { greenhouseFieldMap } from './templates/greenhouse.fields';
import { leverFieldMap } from './templates/lever.fields';

const FIELD_MAPS: Record<'greenhouse' | 'lever' | 'ashby', AtsFieldMap> = {
  greenhouse: greenhouseFieldMap,
  lever: leverFieldMap,
  ashby: ashbyFieldMap,
};

export function getFieldMapForAts(
  atsType: string,
): AtsFieldMap | null {
  if (atsType === 'greenhouse' || atsType === 'lever' || atsType === 'ashby') {
    return FIELD_MAPS[atsType];
  }
  return null;
}

export function detectAtsType(
  canonicalJobKey: string | null | undefined,
  applyUrl: string | null | undefined,
): string {
  if (canonicalJobKey) {
    const decoded = decodeURIComponent(canonicalJobKey).trim().toLowerCase();
    const atsType = decoded.split(':')[0];
    if (atsType === 'greenhouse' || atsType === 'lever' || atsType === 'ashby') {
      return atsType;
    }
  }

  if (applyUrl) {
    try {
      const host = new URL(applyUrl).hostname.toLowerCase();
      if (host.includes('greenhouse.io') || host.includes('grnh.se')) {
        return 'greenhouse';
      }
      if (host.includes('lever.co') || host.includes('jobs.lever')) {
        return 'lever';
      }
      if (host.includes('ashbyhq.com') || host.includes('jobs.ashbyhq')) {
        return 'ashby';
      }
    } catch {
      // ignore invalid URL
    }
  }

  return 'unknown';
}

export function splitFullName(name: string): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  const trimmed = name.trim();
  const space = trimmed.indexOf(' ');
  if (space === -1) {
    return { firstName: trimmed, lastName: '', fullName: trimmed };
  }
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim(),
    fullName: trimmed,
  };
}

export function buildAutofillValues(input: {
  user: {
    name: string;
    email: string;
    linkedinUrl: string | null;
    githubUrl: string | null;
  };
  profile: {
    jobTitle: string;
    locationCity: string | null;
    locationCountry: string | null;
    contactPhone: string | null;
    autofillAnswers: unknown;
  };
  application: {
    coverLetterContent: string | null;
    jobRoleTitle: string | null;
    companyName: string | null;
  };
}): Record<string, string | number | boolean | null> {
  const { firstName, lastName, fullName } = splitFullName(input.user.name);
  const location = [input.profile.locationCity, input.profile.locationCountry]
    .filter(Boolean)
    .join(', ');

  const savedAnswers =
    input.profile.autofillAnswers &&
    typeof input.profile.autofillAnswers === 'object' &&
    !Array.isArray(input.profile.autofillAnswers)
      ? (input.profile.autofillAnswers as Record<string, unknown>)
      : {};

  const values: Record<string, string | number | boolean | null> = {
    firstName,
    lastName,
    fullName,
    email: input.user.email,
    phone: input.profile.contactPhone,
    linkedinUrl: input.user.linkedinUrl,
    githubUrl: input.user.githubUrl,
    jobTitle: input.profile.jobTitle,
    targetRole: input.application.jobRoleTitle ?? input.profile.jobTitle,
    companyName: input.application.companyName,
    locationCity: input.profile.locationCity,
    locationCountry: input.profile.locationCountry,
    location,
    coverLetter: input.application.coverLetterContent,
  };

  for (const [key, value] of Object.entries(savedAnswers)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      values[key] = value;
    } else if (value !== undefined) {
      values[key] = String(value);
    }
  }

  for (const key of Object.keys(values)) {
    if (values[key] === undefined) {
      values[key] = null;
    }
  }

  return values;
}
