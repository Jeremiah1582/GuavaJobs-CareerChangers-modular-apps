/** Cookie set when a signed-out user tries to apply from the public jobs board. */
export const PENDING_JOB_COOKIE = "gj_pending_job";

export const APPLY_GATE_COPY =
  "Set up a free account to apply for this job listing";

export const APPLY_SIGNUP_PATH = "/sign-up?next=/onboarding&intent=apply";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function setPendingJobCookie(canonicalKey: string): void {
  const value = encodeURIComponent(canonicalKey.trim());
  document.cookie = `${PENDING_JOB_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function getPendingJobCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${PENDING_JOB_COOKIE}=`));
  if (!match) return null;
  const raw = match.slice(PENDING_JOB_COOKIE.length + 1);
  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded || null;
  } catch {
    return null;
  }
}

export function clearPendingJobCookie(): void {
  document.cookie = `${PENDING_JOB_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function signUpUrlForPendingJob(canonicalKey: string): string {
  return `${APPLY_SIGNUP_PATH}&job=${encodeURIComponent(canonicalKey)}`;
}
