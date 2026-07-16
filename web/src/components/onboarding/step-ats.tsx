"use client";

import { ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { motion } from "framer-motion";
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
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          CV health check
        </h2>
        <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
          Free industry-specific ATS feedback on your current CV. Does not use
          generation quota. You can skip and run this later from Profile.
        </p>
      </div>

      {!assessment && !loading ? (
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
          </div>

          {assessment.missingKeywords.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Keywords to consider
              </h3>
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

          {assessment.suggestions.length > 0 ? (
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
