"use client";

import { Check } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import type { ApplicationResponse } from "@/api/types";
import {
  ATS_GOOD_SCORE_MIN,
  hasFullJobDescription,
} from "@/lib/applications";

export type ProgressStage = {
  label: string;
  done: boolean;
};

export function hasCoverLetter(app: ApplicationResponse): boolean {
  return (app.coverLetterContent ?? "").trim().length >= 50;
}

export function hasApplicationCv(app: ApplicationResponse): boolean {
  return !!app.cvSnapshot || !!app.generatedCv;
}

export function hasGoodAtsScore(app: ApplicationResponse): boolean {
  const report = app.atsReport;
  if (!report) return false;
  if (report.stale === true) return false;
  return report.score >= ATS_GOOD_SCORE_MIN;
}

export function hasApplied(app: ApplicationResponse): boolean {
  return app.status !== "DRAFT";
}

/** At-a-glance readiness checklist for the application review desk. */
export function applicationProgressStages(
  app: ApplicationResponse,
): ProgressStage[] {
  return [
    { label: "Job description", done: hasFullJobDescription(app) },
    { label: "Cover letter", done: hasCoverLetter(app) },
    { label: "CV", done: hasApplicationCv(app) },
    { label: "ATS score", done: hasGoodAtsScore(app) },
    { label: "Apply", done: hasApplied(app) },
  ];
}

const SIZE = 56;
const STROKE = 4.5;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function ProgressRing({ stages }: { stages: ProgressStage[] }) {
  const reduce = useReducedMotion();
  const doneCount = stages.filter((s) => s.done).length;
  const total = stages.length;
  const progress = total === 0 ? 0 : doneCount / total;
  const offset = C * (1 - progress);
  const complete = doneCount === total && total > 0;

  return (
    <div
      className="flex items-center gap-3"
      role="status"
      aria-label={`Progress: ${doneCount} of ${total} stages complete`}
    >
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-guava-green/15"
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className={complete ? "text-guava-green" : "text-guava-pink"}
            strokeDasharray={C}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 100, damping: 20 }
            }
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {complete ? (
            <Check className="size-5 text-guava-green" weight="bold" />
          ) : (
            <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
              {doneCount}/{total}
            </span>
          )}
        </div>
      </div>

      <ol className="min-w-0 space-y-1">
        {stages.map((stage) => (
          <li key={stage.label} className="flex items-center gap-2 text-xs">
            <span
              className={[
                "size-1.5 shrink-0 rounded-full",
                stage.done ? "bg-guava-green" : "bg-guava-green/25",
              ].join(" ")}
              aria-hidden
            />
            <span
              className={
                stage.done
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {stage.label}
              <span className="sr-only">
                {stage.done ? ", complete" : ", incomplete"}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
