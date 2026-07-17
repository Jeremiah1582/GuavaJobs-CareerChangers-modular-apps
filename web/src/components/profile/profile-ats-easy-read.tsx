"use client";

import {
  ArrowClockwise,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type { ProfileAtsAssessment } from "@/api/types";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { INDUSTRY_LABELS, type ProfileIndustry } from "@/lib/onboarding";
import { PaperPanel } from "@/components/ui/paper-panel";

function scoreTone(score: number): string {
  if (score >= 70) return "text-guava-green";
  if (score >= 45) return "text-foreground";
  return "text-guava-pink";
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

function isAssessmentStale(opts: {
  assessment: ProfileAtsAssessment;
  industry: ProfileIndustry;
  cvUploadedAt: string | null;
}): boolean {
  if (opts.assessment.industry !== opts.industry) return true;
  if (!opts.cvUploadedAt) return false;
  return (
    new Date(opts.cvUploadedAt).getTime() >
    new Date(opts.assessment.assessedAt).getTime()
  );
}

export function ProfileAtsEasyRead({
  profileId,
  assessment,
  industry,
  cvParseStatus,
  cvUploadedAt,
  hasCv,
  getToken,
  onAssessmentChange,
}: {
  profileId: string;
  assessment: ProfileAtsAssessment | null;
  industry: ProfileIndustry;
  cvParseStatus: "PENDING" | "READY" | "FAILED" | null;
  cvUploadedAt: string | null;
  hasCv: boolean;
  getToken: () => Promise<string>;
  onAssessmentChange: (next: ProfileAtsAssessment | null) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewedKey = useRef<string | null>(null);

  const stale =
    assessment != null &&
    isAssessmentStale({ assessment, industry, cvUploadedAt });

  useEffect(() => {
    if (!assessment) return;
    const key = `${assessment.profileId}:${assessment.assessedAt}`;
    if (viewedKey.current === key) return;
    viewedKey.current = key;
    track(AnalyticsEvents.profile_ats_viewed, {
      score: assessment.score,
      industry: assessment.industry,
    });
  }, [assessment]);

  async function runAssessment(isRerun: boolean) {
    setError(null);
    setPending(true);
    try {
      const token = await getToken();
      const result = await apiFetch<ProfileAtsAssessment>(
        `/profiles/${profileId}/ats-assessment`,
        { method: "POST", token },
      );
      onAssessmentChange(result);
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
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Assessment failed");
      }
    } finally {
      setPending(false);
    }
  }

  const canRun =
    hasCv && cvParseStatus === "READY" && !pending;
  const blockedByParse = hasCv && cvParseStatus === "PENDING";
  const blockedByFail = hasCv && cvParseStatus === "FAILED";

  return (
    <PaperPanel className="mt-6 space-y-5 border-guava-green/20 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            CV health check
          </h2>
          <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
            Free industry ATS feedback on your active CV. Does not use
            generation quota. Gaps are suggestions — we never invent employers
            or skills.
          </p>
        </div>
        {assessment && canRun ? (
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

      {stale && assessment && !pending ? (
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
                : "You replaced your CV after this score. Re-run to refresh the report."}
            </p>
            <button
              type="button"
              disabled={!canRun}
              onClick={() => void runAssessment(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-guava-pink px-3.5 py-2 text-sm font-medium text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              Update score
            </button>
          </div>
        </div>
      ) : null}

      {!hasCv ? (
        <p className="text-sm text-muted-foreground">
          Upload a CV above, then run a free health check here.
        </p>
      ) : null}

      {blockedByParse ? (
        <p className="text-sm text-muted-foreground" role="status">
          Wait for CV parsing to finish before running ATS.
        </p>
      ) : null}

      {blockedByFail ? (
        <p className="text-sm text-destructive" role="alert">
          CV parse failed. Fix or replace the file, then run ATS.
        </p>
      ) : null}

      {pending ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleNotch className="size-4 animate-spin" weight="regular" />
            Scoring against {INDUSTRY_LABELS[industry]} criteria…
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
            onClick={() => void runAssessment(Boolean(assessment))}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground active:scale-[0.98] disabled:opacity-60"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!assessment && !pending && canRun ? (
        <button
          type="button"
          onClick={() => void runAssessment(false)}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-guava-pink px-5 py-2.5 text-sm font-medium text-accent-foreground transition-transform active:scale-[0.98]"
        >
          Run free ATS check
        </button>
      ) : null}

      {assessment && !pending ? (
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
            <p className="mt-2 text-xs text-muted-foreground">
              Assessed {formatAssessedAt(assessment.assessedAt)}
            </p>
          </div>

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
                {assessment.suggestions.slice(0, 3).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
          </div>

          {assessment.missingKeywords.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Keywords to consider
              </h3>
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
