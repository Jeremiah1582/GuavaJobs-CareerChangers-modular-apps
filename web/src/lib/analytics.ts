import posthog from "posthog-js";

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
} as const;

export type AnalyticsEvent =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null>,
): void {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (key) {
    posthog.capture(event, properties);
    return;
  }

  if (process.env.NODE_ENV === "development" && process.env.DEBUG_ANALYTICS) {
    console.debug("[analytics]", event, properties ?? {});
  }
}
