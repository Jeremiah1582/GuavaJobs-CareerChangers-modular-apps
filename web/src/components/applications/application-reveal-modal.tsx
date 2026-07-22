"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  CircleNotch,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { apiFetch } from "@/api/client";
import {
  generationPollIntervalMs,
  isGeneratingStatus,
  type ApplicationResponse,
} from "@/api/types";
import {
  applicationCompany,
  applicationTitle,
  ATS_GOOD_SCORE_MIN,
} from "@/lib/applications";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { unwatchGeneration } from "@/lib/generation-watch";
import { getAccessToken } from "@/lib/session";

const LETTER_PEEK_CHARS = 200;
const TOP_GAPS = 3;

function letterPeek(text: string | null | undefined): string | null {
  const raw = (text ?? "").trim();
  if (!raw) return null;
  if (raw.length <= LETTER_PEEK_CHARS) return raw;
  const slice = raw.slice(0, LETTER_PEEK_CHARS);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 80 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

function topGaps(app: ApplicationResponse): string[] {
  const report = app.atsReport;
  if (!report) return [];
  const fromGaps = (report.gaps ?? []).map((g) => g.trim()).filter(Boolean);
  if (fromGaps.length > 0) return fromGaps.slice(0, TOP_GAPS);
  return (report.missingKeywords ?? [])
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, TOP_GAPS)
    .map((k) => `Missing keyword: ${k}`);
}

function scoreTone(score: number): string {
  return score >= ATS_GOOD_SCORE_MIN ? "text-guava-green" : "text-guava-pink";
}

export function ApplicationRevealModal({
  open,
  applicationId,
  onKeepSearching,
  onReviewDraft,
}: {
  open: boolean;
  applicationId: string | null;
  onKeepSearching: () => void;
  onReviewDraft: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef(Date.now());
  const trackedTerminal = useRef<string | null>(null);

  useEffect(() => {
    if (open && applicationId) {
      startedAtRef.current = Date.now();
      trackedTerminal.current = null;
    }
  }, [open, applicationId]);

  const appQuery = useQuery({
    queryKey: ["application-reveal", applicationId] as const,
    enabled: open && !!applicationId,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(`/applications/${applicationId}`, {
        token,
      });
    },
    refetchInterval: (q) => {
      if (!isGeneratingStatus(q.state.data?.generationStatus)) return false;
      return generationPollIntervalMs(Date.now() - startedAtRef.current);
    },
  });

  const app = appQuery.data ?? null;
  const generating = isGeneratingStatus(app?.generationStatus);
  const failed = app?.generationStatus === "FAILED";
  const completed = app?.generationStatus === "COMPLETED";

  useEffect(() => {
    if (!open || !app?.generationStatus) return;
    if (
      app.generationStatus !== "COMPLETED" &&
      app.generationStatus !== "FAILED"
    ) {
      return;
    }
    const key = `${app.id}:${app.generationStatus}:${app.updatedAt}`;
    if (trackedTerminal.current === key) return;
    trackedTerminal.current = key;

    unwatchGeneration(app.id, "package");
    if (app.generationStatus === "COMPLETED") {
      track(AnalyticsEvents.generate_completed, {
        applicationId: app.id,
        canonicalJobKey: app.canonicalJobKey,
        source: "reveal_modal",
      });
    } else {
      track(AnalyticsEvents.generate_failed, {
        applicationId: app.id,
        canonicalJobKey: app.canonicalJobKey,
        error: app.generationError,
        source: "reveal_modal",
      });
    }
  }, [open, app]);

  // Focus trap + Escape → keep searching
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const root = dialogRef.current;
    root?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onKeepSearching();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const nodes = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onKeepSearching]);

  const title = app ? applicationTitle(app) : "Application";
  const company = app ? applicationCompany(app) : null;
  const peek = app ? letterPeek(app.coverLetterContent) : null;
  const gaps = app ? topGaps(app) : [];
  const score = app?.atsReport?.score ?? null;

  return (
    <AnimatePresence>
      {open && applicationId ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 sm:items-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onKeepSearching}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reveal-modal-title"
            aria-busy={generating || undefined}
            tabIndex={-1}
            className="w-full max-w-md rounded-2xl border border-guava-green/20 bg-white p-6 shadow-[0_24px_64px_-24px_rgb(0_0_0_/_0.28)] outline-none"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-widest text-guava-pink">
                  {generating
                    ? "Working"
                    : failed
                      ? "Needs attention"
                      : "Draft ready"}
                </p>
                <h2
                  id="reveal-modal-title"
                  className="mt-1 text-balance text-lg font-semibold tracking-tight"
                >
                  {generating
                    ? "Generating your application…"
                    : failed
                      ? "Generation failed"
                      : "Your draft is ready"}
                </h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {title}
                  {company ? ` · ${company}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onKeepSearching}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Keep searching"
              >
                <X className="size-5" weight="bold" />
              </button>
            </div>

            {generating || appQuery.isLoading ? (
              <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
                <CircleNotch
                  className="size-8 animate-spin text-guava-green"
                  weight="bold"
                />
                <p className="text-sm text-muted-foreground">
                  Scoring fit and drafting your letter. You can keep browsing —
                  we&apos;ll finish in the background.
                </p>
              </div>
            ) : null}

            {failed ? (
              <div className="mt-6 space-y-3" role="alert">
                <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5">
                  <WarningCircle
                    className="mt-0.5 size-5 shrink-0 text-destructive"
                    weight="regular"
                  />
                  <div>
                    <p className="text-sm text-destructive">
                      {app?.generationError ??
                        "Something went wrong while generating."}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Open the draft to retry, or keep searching for another
                      role.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {completed ? (
              <div className="mt-5 space-y-4">
                {score != null ? (
                  <div className="flex items-baseline gap-3">
                    <span
                      className={`font-mono text-3xl font-semibold tabular-nums ${scoreTone(score)}`}
                    >
                      {Math.round(score)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      fit score
                      {score >= ATS_GOOD_SCORE_MIN
                        ? " — solid match"
                        : " — gaps to address"}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Draft saved. Review the letter and fit details before you
                    apply.
                  </p>
                )}

                {gaps.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Gaps to address
                    </p>
                    <ul className="mt-1.5 divide-y divide-border/70 rounded-lg border border-border/80">
                      {gaps.map((gap) => (
                        <li
                          key={gap}
                          className="px-3 py-2 text-xs leading-relaxed text-muted-foreground"
                        >
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {peek ? (
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Letter peek
                    </p>
                    <p className="mt-1.5 rounded-lg border border-border/80 bg-background/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                      {peek}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onKeepSearching}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-guava-green/45"
              >
                Keep searching
              </button>
              {completed || failed ? (
                <button
                  type="button"
                  onClick={() => onReviewDraft(applicationId)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98]"
                >
                  {failed ? "Open draft" : "Review draft"}
                </button>
              ) : (
                <Link
                  href={`/app/applications/${applicationId}`}
                  onClick={onKeepSearching}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98]"
                >
                  Open draft
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
