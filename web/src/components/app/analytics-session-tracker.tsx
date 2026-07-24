"use client";

import { useEffect, useRef } from "react";
import {
  AnalyticsEvents,
  sendSessionEnded,
  sendSessionHeartbeat,
  track,
} from "@/lib/analytics";

const HEARTBEAT_MS = 60_000;

function createSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Per-tab session tracker: heartbeat while visible, end on hide/unload. */
export function AnalyticsSessionTracker() {
  const sessionIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    sessionIdRef.current = createSessionId();
    startedAtRef.current = Date.now();

    let interval: ReturnType<typeof setInterval> | null = null;

    function heartbeat() {
      const id = sessionIdRef.current;
      if (!id) return;
      void sendSessionHeartbeat(id);
      track(AnalyticsEvents.session_heartbeat, { sessionId: id });
    }

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      heartbeat();
      if (!interval) {
        interval = setInterval(heartbeat, HEARTBEAT_MS);
      }
    }

    function onHide() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      const id = sessionIdRef.current;
      if (!id) return;
      const durationMs = Date.now() - startedAtRef.current;
      void sendSessionEnded(id, durationMs);
    }

    heartbeat();
    interval = setInterval(heartbeat, HEARTBEAT_MS);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        onHide();
      } else {
        onVisible();
      }
    });
    window.addEventListener("pagehide", onHide);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("pagehide", onHide);
      onHide();
    };
  }, []);

  return null;
}
