"use client";

import {
  ArrowRight,
  CheckCircle,
  CircleNotch,
  XCircle,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ProfileAtsAssessment } from "@/api/types";
import { INDUSTRY_LABELS } from "@/lib/onboarding";

export function StepAts({
  assessment,
  loading,
  error,
  onRun,
  onFinish,
  onSkip,
}: {
  assessment: ProfileAtsAssessment | null;
  loading: boolean;
  error: string | null;
  onRun: () => Promise<void>;
  onFinish: () => void;
  onSkip: () => void;
}) {
  const autoRan = useRef(false);

  useEffect(() => {
    if (assessment || loading || error || autoRan.current) return;
    autoRan.current = true;
    void onRun();
  }, [assessment, loading, error, onRun]);

  const checklist = assessment?.checklist ?? [];
  const priorityActions = assessment?.priorityActions ?? [];
  const strengths = assessment?.strengths ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          CV health check
        </h2>
        <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
          Free industry-specific ATS feedback on your current CV. Runs
          automatically — does not use generation quota. You can skip and revisit
          from Profile.
        </p>
      </div>

      {!assessment && !loading && !error ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void onRun()}
            className="inline-flex items-center gap-2 rounded-lg bg-guava-pink px-5 py-2.5 text-sm font-medium text-accent-foreground transition-transform active:scale-[0.98]"
          >
            Run free ATS check
            <ArrowRight className="size-4" weight="regular" />
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
          >
            Skip for now
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleNotch className="size-4 animate-spin" weight="regular" />
            Scoring against your industry criteria…
          </div>
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : null}

      {error ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void onRun()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground active:scale-[0.98]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg border border-border px-4 py-2 text-sm active:scale-[0.98]"
            >
              Continue without score
            </button>
          </div>
        </div>
      ) : null}

      {assessment ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="space-y-6"
        >
          <div className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              {INDUSTRY_LABELS[assessment.industry]} score
            </p>
            <p
              className={[
                "mt-1 font-mono text-5xl font-semibold tracking-tight",
                assessment.score >= 70
                  ? "text-guava-green"
                  : assessment.score >= 40
                    ? "text-foreground"
                    : "text-destructive",
              ].join(" ")}
            >
              {assessment.score}
              <span className="text-lg text-muted-foreground">/100</span>
            </p>
            {assessment.summary ? (
              <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-foreground">
                {assessment.summary}
              </p>
            ) : null}
          </div>

          {priorityActions.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-foreground">
                What to improve first
              </h3>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                {priorityActions.slice(0, 4).map((a) => (
                  <li key={a.title}>
                    <span className="font-medium text-foreground">
                      {a.title}
                    </span>
                    {" — "}
                    {a.detail}
                  </li>
                ))}
              </ol>
            </div>
          ) : assessment.suggestions.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Suggestions
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                {assessment.suggestions.slice(0, 6).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {strengths.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-foreground">
                What already works
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                {strengths.slice(0, 4).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {checklist.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-foreground">
                ATS checklist
              </h3>
              <ul className="mt-2 space-y-1.5">
                {checklist.slice(0, 6).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
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
                      {" — "}
                      {item.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {assessment.missingKeywords.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Keywords to consider
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Only add terms you can honestly defend.
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {assessment.missingKeywords.slice(0, 12).map((kw) => (
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

          <button
            type="button"
            onClick={onFinish}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Go to jobs
            <ArrowRight className="size-4" weight="regular" />
          </button>
        </motion.div>
      ) : null}
    </div>
  );
}
