import { createHash } from 'crypto';

/** Inputs that affect ApplicationAtsReport scoring. */
export type AtsFingerprintInput = {
  jobDescription: string;
  coverLetter: string;
  cvText: string;
  cvChoice: 'UPLOADED' | 'GENERATED' | string;
  /** Serialized master career corpus (ProfileCareerCv.content); omit/empty when none. */
  careerContent?: string | null;
};

export function buildApplicationAtsFingerprint(
  input: AtsFingerprintInput,
): string {
  const jd = input.jobDescription.trim();
  const letter = input.coverLetter.trim();
  const cv = input.cvText.trim();
  const career = (input.careerContent ?? '').trim();
  const payload: Record<string, unknown> = {
    v: 1,
    cvChoice: input.cvChoice || 'UPLOADED',
    jdLen: jd.length,
    jdHash: sha256(jd),
    letterLen: letter.length,
    letterHash: sha256(letter),
    cvLen: cv.length,
    cvHash: sha256(cv),
  };
  // Only include when present so existing fingerprints stay stable until career exists.
  if (career) {
    payload.careerLen = career.length;
    payload.careerHash = sha256(career);
  }
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function resolveJobDescriptionForAts(app: {
  pastedJobDescription: string | null;
  jobSnapshot: unknown;
}): string {
  const pasted = app.pastedJobDescription?.trim() ?? '';
  if (pasted) return pasted;
  const snap =
    app.jobSnapshot &&
    typeof app.jobSnapshot === 'object' &&
    !Array.isArray(app.jobSnapshot)
      ? (app.jobSnapshot as Record<string, unknown>)
      : null;
  const fromSnap =
    typeof snap?.description === 'string' ? snap.description.trim() : '';
  return fromSnap;
}

type CareerCvSource = {
  content?: unknown;
} | null;

type ProfileWithCv = {
  currentCv?: { parsedText: string | null } | null;
  careerCv?: CareerCvSource;
} | null;

/** Latest uploaded CV text for tailored CV generation (prefers live profile CV). */
export function resolveCvTextForGeneration(app: {
  cvSnapshot: unknown;
  profile?: ProfileWithCv;
  /** Direct career content when profile.careerCv is not loaded. */
  careerCvContent?: unknown;
}): string {
  const fromProfile = app.profile?.currentCv?.parsedText?.trim() ?? '';
  const base = fromProfile
    ? fromProfile
    : (() => {
        const snap =
          app.cvSnapshot &&
          typeof app.cvSnapshot === 'object' &&
          !Array.isArray(app.cvSnapshot)
            ? (app.cvSnapshot as Record<string, unknown>)
            : null;
        return typeof snap?.parsedText === 'string'
          ? snap.parsedText.trim()
          : '';
      })();

  return appendCareerSupplement(
    base,
    app.careerCvContent ?? app.profile?.careerCv?.content,
  );
}

export function resolveCvTextForAts(app: {
  cvChoice: string;
  cvSnapshot: unknown;
  generatedCv?: { content: unknown } | null;
  profile?: ProfileWithCv;
  careerCvContent?: unknown;
}): string {
  let base = '';
  if (app.cvChoice === 'GENERATED' && app.generatedCv?.content != null) {
    base =
      typeof app.generatedCv.content === 'string'
        ? app.generatedCv.content
        : JSON.stringify(app.generatedCv.content);
  } else {
    const snap =
      app.cvSnapshot &&
      typeof app.cvSnapshot === 'object' &&
      !Array.isArray(app.cvSnapshot)
        ? (app.cvSnapshot as Record<string, unknown>)
        : null;
    const fromSnap =
      typeof snap?.parsedText === 'string' ? snap.parsedText.trim() : '';
    base = fromSnap || (app.profile?.currentCv?.parsedText?.trim() ?? '');
  }

  return appendCareerSupplement(
    base,
    app.careerCvContent ?? app.profile?.careerCv?.content,
  );
}

/** Stable serialization of ProfileCareerCv.content for fingerprints / prompts. */
export function serializeCareerContent(content: unknown): string {
  if (content == null) return '';
  if (typeof content === 'string') return content.trim();
  try {
    return JSON.stringify(content);
  } catch {
    return '';
  }
}

function appendCareerSupplement(base: string, careerContent: unknown): string {
  const career = serializeCareerContent(careerContent);
  if (!career) return base;
  if (!base.trim()) {
    return `Master career profile:\n${career}`;
  }
  return `${base.trim()}\n\n--- Master career profile ---\n${career}`;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
