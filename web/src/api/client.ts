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

/** Public endpoints (e.g. GET /jobs/search) — no Bearer required. */
export async function publicApiFetch<T>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  return apiFetch<T>(path, opts);
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
  // Authenticated app data must not use conditional/304 caching via the
  // Next rewrite proxy (empty 304 bodies break JSON parsing / polling).
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-cache");
  }

  let res: Response;
  try {
    res = await fetch(resolveApiUrl(path), {
      ...rest,
      headers,
      body,
      cache: rest.cache ?? "no-store",
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Network error";
    throw new ApiError(
      `Could not reach API (${reason}). Check NEXT_PUBLIC_API_URL / API_UPSTREAM and that Coolify is up.`,
      { status: 0, code: "NETWORK_ERROR" },
    );
  }

  if (res.status === 304) {
    throw new ApiError(
      "Stale cached API response (304). Retrying without cache.",
      { status: 304, code: "CACHE_STALE" },
    );
  }

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as
      | ApiErrorBody
      | { message?: string | string[]; error?: string; statusCode?: number }
      | null;

    const nestMessage =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      !("error" in payload && typeof (payload as ApiErrorBody).error === "object")
        ? Array.isArray(payload.message)
          ? payload.message.join(", ")
          : typeof payload.message === "string"
            ? payload.message
            : undefined
        : undefined;

    const appMessage =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "message" in payload.error
        ? (payload as ApiErrorBody).error?.message
        : undefined;

    const errorCode = (payload as ApiErrorBody)?.error?.code;
    const errorDetails = (payload as ApiErrorBody)?.error?.details;

    const validationHint =
      errorCode === "VALIDATION_ERROR" &&
      errorDetails &&
      typeof errorDetails === "object" &&
      "issues" in errorDetails &&
      Array.isArray((errorDetails as { issues: unknown }).issues)
        ? formatZodIssues(
            (errorDetails as { issues: ZodIssueLike[] }).issues,
          )
        : undefined;

    const fallback =
      res.status === 500 || res.status === 502 || res.status === 504
        ? "The API returned an error. Check that it is running and try again."
        : res.statusText || "Request failed";
    throw new ApiError(validationHint ?? appMessage ?? nestMessage ?? fallback, {
      status: res.status,
      code: errorCode,
      details: errorDetails,
    });
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

type ZodIssueLike = { path?: (string | number)[]; message?: string };

function formatZodIssues(issues: ZodIssueLike[]): string | undefined {
  const first = issues[0];
  if (!first) return undefined;
  const field = first.path?.length ? first.path.join(".") : "input";
  return `${field}: ${first.message ?? "Invalid value"}`;
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
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-cache");
  }

  let res: Response;
  try {
    res = await fetch(resolveApiUrl(path), {
      ...rest,
      headers,
      body,
      cache: rest.cache ?? "no-store",
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
