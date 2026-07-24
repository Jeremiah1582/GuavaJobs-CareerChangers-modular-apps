import posthog from "posthog-js";
import { apiFetch } from "@/api/client";
import { getAccessTokenOrNull } from "@/lib/session";

/** PostHog event names — keep identical across web and (later) mobile. */
export const AnalyticsEvents = {
  signup_completed: "signup_completed",
  login_completed: "login_completed",
  onboarding_step_completed: "onboarding_step_completed",
  cv_uploaded: "cv_uploaded",
  cv_parse_succeeded: "cv_parse_succeeded",
  cv_parse_failed: "cv_parse_failed",
  profile_ats_viewed: "profile_ats_viewed",
  profile_ats_rerun: "profile_ats_rerun",
  market_fit_viewed: "market_fit_viewed",
  market_fit_generated: "market_fit_generated",
  job_search: "job_search",
  job_detail_view: "job_detail_view",
  job_bookmarked: "job_bookmarked",
  job_unbookmarked: "job_unbookmarked",
  bookmark_resolve_gone: "bookmark_resolve_gone",
  generate_started: "generate_started",
  generate_completed: "generate_completed",
  generate_failed: "generate_failed",
  letter_edited: "letter_edited",
  quota_hit: "quota_hit",
  application_status_changed: "application_status_changed",
  apply_opened: "apply_opened",
  apply_confirmed: "apply_confirmed",
  apply_deferred: "apply_deferred",
  event_added: "event_added",
  event_deleted: "event_deleted",
  application_deleted: "application_deleted",
  manual_application_created: "manual_application_created",
  pdf_exported: "pdf_exported",
  session_heartbeat: "session_heartbeat",
  session_end: "session_end",
} as const;

export type AnalyticsEvent =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/** Events mirrored to POST /analytics/events (allowlisted server-side). */
const INGEST_EVENTS = new Set<string>([
  AnalyticsEvents.signup_completed,
  AnalyticsEvents.login_completed,
  AnalyticsEvents.job_search,
  AnalyticsEvents.session_heartbeat,
  AnalyticsEvents.session_end,
]);

export function identifyAnalyticsUser(userId: string): void {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (key) {
    posthog.identify(userId);
  }
}

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null>,
): void {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (key) {
    posthog.capture(event, properties);
  } else if (
    process.env.NODE_ENV === "development" &&
    process.env.DEBUG_ANALYTICS
  ) {
    console.debug("[analytics]", event, properties ?? {});
  }

  if (INGEST_EVENTS.has(event)) {
    void dualWriteEvent(event, properties);
  }
}

async function dualWriteEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null>,
): Promise<void> {
  try {
    const token = await getAccessTokenOrNull();
    if (!token) return;

    await apiFetch("/analytics/events", {
      method: "POST",
      token,
      body: JSON.stringify({
        events: [
          {
            event,
            properties: properties ?? {},
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    // Fire-and-forget — never block UX
  }
}

export async function sendSessionHeartbeat(sessionId: string): Promise<void> {
  try {
    const token = await getAccessTokenOrNull();
    if (!token) return;

    await apiFetch("/analytics/sessions", {
      method: "POST",
      token,
      body: JSON.stringify({ sessionId }),
    });
  } catch {
    /* ignore */
  }
}

export async function sendSessionEnded(
  sessionId: string,
  durationMs: number,
): Promise<void> {
  try {
    const token = await getAccessTokenOrNull();
    if (!token) return;

    await apiFetch("/analytics/sessions", {
      method: "POST",
      token,
      body: JSON.stringify({ sessionId, ended: true, durationMs }),
    });

    await apiFetch("/analytics/events", {
      method: "POST",
      token,
      body: JSON.stringify({
        events: [
          {
            event: AnalyticsEvents.session_end,
            properties: { durationMs },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    /* ignore */
  }
}
