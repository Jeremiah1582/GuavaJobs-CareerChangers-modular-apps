"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

let posthogInitialized = false;

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!posthogKey || posthogInitialized) return;
    posthogInitialized = true;

    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: false,
      person_profiles: "identified_only",
    });
  }, []);

  if (!posthogKey) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
