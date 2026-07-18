"use client";

import {
  ArrowClockwise,
  CheckCircle,
  CircleNotch,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type { ProfileAtsAssessment, ProfileDetail } from "@/api/types";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { INDUSTRY_LABELS, type ProfileIndustry } from "@/lib/onboarding";
import { PaperPanel } from "@/components/ui/paper-panel";

function scoreTone(score: number): string {
  if (score >= 70) return "text-guava-green";
  if (score >= 45) return "text-foreground";
  return "text-guava-pink";
}

function impactTone(impact: "high" | "medium" | "low"): string {
  if (impact === "high")
    return "border-guava-pink/30 bg-guava-pink/5 text-guava-pink";
  if (impact === "medium") return "border-border bg-secondary text-foreground";
  return "border-border bg-card text-muted-foreground";
}

function formatAssessedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function isAssessmentCurrent(opts: {
  assessment: ProfileAtsAssessment;
  industry: ProfileIndustry;
  cvDocumentId: string | null;
  cvUploadedAt: string | null;
}): boolean {
  if (opts.assessment.industry !== opts.industry) return false;
  if (opts.cvDocumentId) {
    if (opts.assessment.cvDocumentId) {
      return opts.assessment.cvDocumentId === opts.cvDocumentId;
    }
    // Legacy rows without cvDocumentId — fall back to upload timestamp.
  }
  if (!opts.cvUploadedAt) return true;
  return (
    new Date(opts.assessment.assessedAt).getTime() >=
    new Date(opts.cvUploadedAt).getTime()
  );
}

export function ProfileAtsEasyRead({
  profileId,
  assessment,
  industry,
  cvParseStatus,
  cvDocumentId,
  cvUploadedAt,
  hasCv,
  getToken,
  onAssessmentChange,
}: {
  profileId: string;
  assessment: ProfileAtsAssessment | null;
  industry: ProfileIndustry;
  cvParseStatus: "PENDING" | "READY" | "FAILED" | null;
  cvDocumentId: string | null;
  cvUploadedAt: string | null;
  hasCv: boolean;
  getToken: () => Promise<string>;
  onAssessmentChange: (next: ProfileAtsAssessment | null) => void;
}) {
  const [pending, setPending] = useState(false);
  const [waitingAuto, setWaitingAuto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewedKey = useRef<string | null>(null);
  const inFlightCv = useRef<string | null>(null);
  const autoFailedForCv = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const onChangeRef = useRef(onAssessmentChange);
  onChangeRef.current = onAssessmentChange;

  const current =
    assessment != null &&
    isAssessmentCurrent({
      assessment,
      industry,
      cvDocumentId,
      cvUploadedAt,
    });
  const stale = assessment != null && !current;

  const canRun = hasCv && cvParseStatus === "READY" && !pending;
  const blockedByParse = hasCv && cvParseStatus === "PENDING";
  const blockedByFail = hasCv && cvParseStatus === "FAILED";
  const needsAssessment =
    hasCv && cvParseStatus === "READY" && Boolean(cvDocumentId) && !current;

  function stopPoll() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }

  useEffect(() => () => stopPoll(), []);

  // New CV identity clears prior auto-fail latch.
  useEffect(() => {
    if (cvDocumentId && autoFailedForCv.current !== cvDocumentId) {
      // Keep latch only for the current CV; switching CVs resets.
      if (autoFailedForCv.current && autoFailedForCv.current !== cvDocumentId) {
        autoFailedForCv.current = null;
      }
    }
  }, [cvDocumentId]);

  useEffect(() => {
    if (!assessment || !current) return;
    const key = `${assessment.profileId}:${assessment.assessedAt}`;
    if (viewedKey.current === key) return;
    viewedKey.current = key;
    track(AnalyticsEvents.profile_ats_viewed, {
      score: assessment.score,
      industry: assessment.industry,
    });
  }, [assessment, current]);

  const runAssessment = useCallback(
    async (isRerun: boolean) => {
      const cvKey = cvDocumentId ?? "unknown";
      setError(null);
      setPending(true);
      setWaitingAuto(false);
      stopPoll();
      inFlightCv.current = cvKey;
      try {
        const token = await getTokenRef.current();
        const result = await apiFetch<ProfileAtsAssessment>(
          `/profiles/${profileId}/ats-assessment`,
          { method: "POST", token },
        );
        // Ignore late responses after another CV replace.
        if (inFlightCv.current !== cvKey) return;
        if (
          cvDocumentId &&
          result.cvDocumentId &&
          result.cvDocumentId !== cvDocumentId
        ) {
          return;
        }
        autoFailedForCv.current = null;
        onChangeRef.current(result);
        if (isRerun) {
          track(AnalyticsEvents.profile_ats_rerun, {
            score: result.score,
            industry: result.industry,
          });
        } else {
          track(AnalyticsEvents.profile_ats_viewed, {
            score: result.score,
            industry: result.industry,
          });
        }
        viewedKey.current = `${result.profileId}:${result.assessedAt}`;
      } catch (err) {
        if (inFlightCv.current !== cvKey) return;
        autoFailedForCv.current = cvKey;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : "Assessment failed");
        }
      } finally {
        if (inFlightCv.current === cvKey) {
          setPending(false);
        }
      }
    },
    [cvDocumentId, profileId],
  );

  // Durable auto-run: poll for backend schedule, then POST if still missing.
  // Keyed by cvDocumentId so replace always starts a fresh cycle (Strict Mode safe).
  useEffect(() => {
    if (!needsAssessment || !cvDocumentId || pending) return;
    // Manual retry after failure — don't spin forever on proxy/LLM errors.
    if (autoFailedForCv.current === cvDocumentId) return;

    let cancelled = false;
    const targetCv = cvDocumentId;
    const hadAssessment = Boolean(assessment);
    setWaitingAuto(true);
    setError(null);
    stopPoll();

    const started = Date.now();

    async function tick() {
      if (cancelled) return;
      try {
        const token = await getTokenRef.current();
        const detail = await apiFetch<ProfileDetail>(`/profiles/${profileId}`, {
          token,
        });
        if (cancelled) return;
        const next = detail.generalAtsAssessment;
        if (
          next &&
          isAssessmentCurrent({
            assessment: next,
            industry,
            cvDocumentId: targetCv,
            cvUploadedAt,
          })
        ) {
          stopPoll();
          setWaitingAuto(false);
          autoFailedForCv.current = null;
          onChangeRef.current(next);
          return;
        }
      } catch {
        // keep polling
      }

      // Don't wait forever on flaky proxies — kick an explicit POST.
      if (Date.now() - started > 8_000) {
        stopPoll();
        setWaitingAuto(false);
        if (!cancelled) void runAssessment(hadAssessment);
      }
    }

    void tick();
    pollTimer.current = setInterval(() => void tick(), 2000);

    return () => {
      cancelled = true;
      stopPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cvDocumentId is the durability key
  }, [needsAssessment, cvDocumentId, profileId, industry, pending, runAssessment]);

  const showBusy = pending || waitingAuto;
  const checklist = assessment?.checklist ?? [];
  const priorityActions = assessment?.priorityActions ?? [];
  const strengths = assessment?.strengths ?? [];

  return (
    <PaperPanel className="mt-6 space-y-5 border-guava-green/20 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            CV health check
          </h2>
          <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
            Free industry ATS feedback on your active CV. Runs automatically
            after every upload or replace. Gaps are suggestions — we never invent
            employers or skills.
          </p>
        </div>
        {assessment && current && canRun && !showBusy ? (
          <button
            type="button"
            onClick={() => void runAssessment(true)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? (
              <CircleNotch className="size-4 animate-spin" weight="regular" />
            ) : (
              <ArrowClockwise className="size-4" weight="regular" />
            )}
            Re-run
          </button>
        ) : null}
      </div>

      {stale && assessment && !showBusy ? (
        <div
          className="flex flex-wrap items-start gap-3 rounded-lg border border-guava-pink/25 bg-guava-pink/5 px-3 py-3"
          role="status"
        >
          <WarningCircle
            className="mt-0.5 size-5 shrink-0 text-guava-pink"
            weight="regular"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm text-foreground">
              {assessment.industry !== industry
                ? "Industry or role changed since this score. Re-run for an up-to-date check."
                : "You replaced your CV. Refreshing the ATS report for the new file…"}
            </p>
            <button
              type="button"
              disabled={!canRun}
              onClick={() => void runAssessment(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-guava-pink px-3.5 py-2 text-sm font-medium text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              Update score now
            </button>
          </div>
        </div>
      ) : null}

      {!hasCv ? (
        <p className="text-sm text-muted-foreground">
          Upload a CV above — we analyse it against ATS criteria automatically.
        </p>
      ) : null}

      {blockedByParse ? (
        <p className="text-sm text-muted-foreground" role="status">
          Wait for CV parsing to finish before ATS can run.
        </p>
      ) : null}

      {blockedByFail ? (
        <p className="text-sm text-destructive" role="alert">
          CV parse failed. Fix or replace the file, then we can score it.
        </p>
      ) : null}

      {showBusy ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleNotch className="size-4 animate-spin" weight="regular" />
            {waitingAuto && !pending
              ? `Analysing your CV against ${INDUSTRY_LABELS[industry]} ATS criteria…`
              : `Scoring against ${INDUSTRY_LABELS[industry]} criteria…`}
          </div>
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : null}

      {error ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <button
            type="button"
            disabled={!canRun}
            onClick={() => {
              autoFailedForCv.current = null;
              void runAssessment(Boolean(assessment && current));
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground active:scale-[0.98] disabled:opacity-60"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!assessment && !showBusy && canRun ? (
        <button
          type="button"
          onClick={() => void runAssessment(false)}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-guava-pink px-5 py-2.5 text-sm font-medium text-accent-foreground transition-transform active:scale-[0.98]"
        >
          Run free ATS check
        </button>
      ) : null}

      {assessment && current && !showBusy ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="space-y-6 border-t border-border pt-5"
        >
          <div>
            <p className="text-sm text-muted-foreground">
              {INDUSTRY_LABELS[assessment.industry]} score
            </p>
            <p
              className={`mt-1 font-mono text-5xl font-semibold tracking-tight ${scoreTone(assessment.score)}`}
            >
              {assessment.score}
              <span className="text-lg text-muted-foreground">/100</span>
            </p>
            {assessment.summary ? (
              <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-foreground">
                {assessment.summary}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Assessed {formatAssessedAt(assessment.assessedAt)}
            </p>
          </div>

          {priorityActions.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                What to improve first
              </h3>
              <ol className="mt-3 space-y-3">
                {priorityActions.slice(0, 5).map((action) => (
                  <li
                    key={`${action.title}:${action.detail.slice(0, 24)}`}
                    className="rounded-lg border border-border px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {action.title}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${impactTone(action.impact)}`}
                      >
                        {action.impact} impact
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {action.detail}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                What to improve
              </h3>
              {assessment.suggestions.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No specific gaps called out — still review your CV before
                  applying.
                </p>
              ) : (
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {assessment.suggestions.slice(0, 5).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {strengths.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                What already works
              </h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                {strengths.slice(0, 5).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {checklist.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                ATS parseability checklist
              </h3>
              <ul className="mt-3 space-y-2">
                {checklist.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2.5 text-sm leading-relaxed"
                  >
                    {item.passed ? (
                      <CheckCircle
                        className="mt-0.5 size-4 shrink-0 text-guava-green"
                        weight="regular"
                      />
                    ) : (
                      <XCircle
                        className="mt-0.5 size-4 shrink-0 text-guava-pink"
                        weight="regular"
                      />
                    )}
                    <span>
                      <span className="font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="text-muted-foreground">
                        {" — "}
                        {item.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {assessment.missingKeywords.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Keywords to consider
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Only add terms you can honestly defend in an interview.
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {assessment.missingKeywords.slice(0, 16).map((kw) => (
                  <li
                    key={kw}
                    className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs text-foreground"
                  >
                    {kw}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {Object.keys(assessment.breakdown).length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Breakdown
              </h3>
              <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                {Object.entries(assessment.breakdown).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-baseline justify-between gap-3 border-t border-border pt-2 text-sm"
                  >
                    <dt className="capitalize text-muted-foreground">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </dt>
                    <dd className={`font-mono font-medium ${scoreTone(value)}`}>
                      {Math.round(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </PaperPanel>
  );
}
