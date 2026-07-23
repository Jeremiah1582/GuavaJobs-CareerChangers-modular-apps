/** Session storage for CV selected on the marketing page before auth. */
export const PENDING_CV_STORAGE_KEY = "gj_pending_cv";

export const MARKET_FIT_SIGNUP_PATH =
  "/sign-up?next=/app/profile&intent=market-fit";

export const MARKET_FIT_SIGNIN_PATH =
  "/sign-in?next=/app/profile&intent=market-fit";

const MAX_BYTES = 5 * 1024 * 1024;

type PendingCvPayload = {
  fileName: string;
  mimeType: string;
  base64: string;
  storedAt: string;
};

export async function storePendingCv(file: File): Promise<void> {
  if (file.size > MAX_BYTES) {
    throw new Error("File must be 5 MB or smaller.");
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const payload: PendingCvPayload = {
    fileName: file.name,
    mimeType: file.type,
    base64: btoa(binary),
    storedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(PENDING_CV_STORAGE_KEY, JSON.stringify(payload));
}

export function readPendingCv(): PendingCvPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_CV_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingCvPayload;
  } catch {
    return null;
  }
}

export function clearPendingCv(): void {
  sessionStorage.removeItem(PENDING_CV_STORAGE_KEY);
}

export function pendingCvToFile(payload: PendingCvPayload): File {
  const binary = atob(payload.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], payload.fileName, {
    type: payload.mimeType || "application/pdf",
  });
}
