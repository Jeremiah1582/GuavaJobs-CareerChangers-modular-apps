export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    opts: { status: number; code?: string; details?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

/**
 * Resolve API base.
 * - Absolute `NEXT_PUBLIC_API_URL` (http…) → call Coolify directly (`…/api/v1/...`)
 * - Relative `/guava-api` (default) → same-origin Next rewrite (avoids browser CORS)
 */
function resolveApiUrl(path: string): string {
  const configured = (
    process.env.NEXT_PUBLIC_API_URL || "/guava-api"
  ).replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return `${configured}/api/v1${normalizedPath}`;
  }

  const relative = `${configured}${normalizedPath}`;
  if (typeof window === "undefined") {
    const site = (
      process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000"
    ).replace(/\/$/, "");
    return `${site}${relative}`;
  }
  return relative;
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers: initHeaders, body, ...rest } = opts;
  const headers = new Headers(initHeaders);

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(resolveApiUrl(path), {
      ...rest,
      headers,
      body,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Network error";
    throw new ApiError(
      `Could not reach API (${reason}). Check NEXT_PUBLIC_API_URL / API_UPSTREAM and that Coolify is up.`,
      { status: 0, code: "NETWORK_ERROR" },
    );
  }

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      payload?.error?.message ?? res.statusText ?? "Request failed",
      {
        status: res.status,
        code: payload?.error?.code,
        details: payload?.error?.details,
      },
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/** Binary responses (e.g. cover-letter PDF). */
export async function apiFetchBlob(
  path: string,
  opts: RequestInit & { token?: string } = {},
): Promise<Blob> {
  const { token, headers: initHeaders, body, ...rest } = opts;
  const headers = new Headers(initHeaders);

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(resolveApiUrl(path), {
      ...rest,
      headers,
      body,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Network error";
    throw new ApiError(
      `Could not reach API (${reason}). Check NEXT_PUBLIC_API_URL / API_UPSTREAM and that Coolify is up.`,
      { status: 0, code: "NETWORK_ERROR" },
    );
  }

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      payload?.error?.message ?? res.statusText ?? "Request failed",
      {
        status: res.status,
        code: payload?.error?.code,
        details: payload?.error?.details,
      },
    );
  }

  return res.blob();
}
