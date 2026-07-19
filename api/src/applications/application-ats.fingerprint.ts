import { createHash } from 'crypto';

/** Inputs that affect ApplicationAtsReport scoring. */
export type AtsFingerprintInput = {
  jobDescription: string;
  coverLetter: string;
  cvText: string;
  cvChoice: 'UPLOADED' | 'GENERATED' | string;
};

export function buildApplicationAtsFingerprint(
  input: AtsFingerprintInput,
): string {
  const jd = input.jobDescription.trim();
  const letter = input.coverLetter.trim();
  const cv = input.cvText.trim();
  const payload = JSON.stringify({
    v: 1,
    cvChoice: input.cvChoice || 'UPLOADED',
    jdLen: jd.length,
    jdHash: sha256(jd),
    letterLen: letter.length,
    letterHash: sha256(letter),
    cvLen: cv.length,
    cvHash: sha256(cv),
  });
  return createHash('sha256').update(payload).digest('hex');
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

/** Latest uploaded CV text for tailored CV generation (prefers live profile CV). */
export function resolveCvTextForGeneration(app: {
  cvSnapshot: unknown;
  profile?: { currentCv?: { parsedText: string | null } | null } | null;
}): string {
  const fromProfile = app.profile?.currentCv?.parsedText?.trim() ?? '';
  if (fromProfile) return fromProfile;

  const snap =
    app.cvSnapshot &&
    typeof app.cvSnapshot === 'object' &&
    !Array.isArray(app.cvSnapshot)
      ? (app.cvSnapshot as Record<string, unknown>)
      : null;
  return typeof snap?.parsedText === 'string' ? snap.parsedText.trim() : '';
}

export function resolveCvTextForAts(app: {
  cvChoice: string;
  cvSnapshot: unknown;
  generatedCv?: { content: unknown } | null;
  profile?: { currentCv?: { parsedText: string | null } | null } | null;
}): string {
  if (app.cvChoice === 'GENERATED' && app.generatedCv?.content != null) {
    return typeof app.generatedCv.content === 'string'
      ? app.generatedCv.content
      : JSON.stringify(app.generatedCv.content);
  }
  const snap =
    app.cvSnapshot &&
    typeof app.cvSnapshot === 'object' &&
    !Array.isArray(app.cvSnapshot)
      ? (app.cvSnapshot as Record<string, unknown>)
      : null;
  const fromSnap =
    typeof snap?.parsedText === 'string' ? snap.parsedText.trim() : '';
  if (fromSnap) return fromSnap;
  return app.profile?.currentCv?.parsedText?.trim() ?? '';
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
