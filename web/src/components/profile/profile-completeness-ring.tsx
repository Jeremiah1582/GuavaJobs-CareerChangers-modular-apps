"use client";

import Link from "next/link";
import { Check } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import type { CompletenessResult } from "@/lib/profile-completeness";

const SIZE = 64;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

type Props = {
  completeness: CompletenessResult;
  /** When true, missing items are tips only (no section jump links). */
  compact?: boolean;
};

export function ProfileCompletenessRing({ completeness, compact }: Props) {
  const reduce = useReducedMotion();
  const { percent, doneCount, total, missing, sections } = completeness;
  const offset = C * (1 - percent / 100);
  const complete = percent >= 100;

  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5"
      role="status"
      aria-label={`Profile ${percent}% complete, ${doneCount} of ${total} sections`}
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
            <Check className="size-6 text-guava-green" weight="bold" />
          ) : (
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {percent}%
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            {complete ? "Profile ready for strong generates" : "Profile completeness"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {complete
              ? "Target role, skills, and CV are in place. Generate anytime."
              : "Fill the gaps below for stronger letters — Generate still works either way."}
          </p>
        </div>

        {compact ? (
          missing.length > 0 ? (
            <p className="text-xs text-muted-foreground">{missing[0]?.tip}</p>
          ) : null
        ) : (
          <ol className="divide-y divide-border/60 rounded-lg border border-border/80 bg-background/60">
            {sections.map((section) => (
              <li
                key={section.id}
                className="flex items-start gap-2.5 px-3 py-2 text-xs"
              >
                <span
                  className={[
                    "mt-1 size-1.5 shrink-0 rounded-full",
                    section.done ? "bg-guava-green" : "bg-guava-pink/50",
                  ].join(" ")}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <span
                    className={
                      section.done
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {section.label}
                  </span>
                  {!section.done ? (
                    <p className="mt-0.5 text-muted-foreground">{section.tip}</p>
                  ) : null}
                </div>
                <span className="sr-only">
                  {section.done ? "complete" : "incomplete"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

/** Soft tip under Generate — never disables the button. */
export function GenerateSoftGate({
  tip,
}: {
  tip: string | null;
}) {
  if (!tip) return null;
  const text = tip.replace(/\.\s*$/, "");
  return (
    <p className="text-xs text-muted-foreground">
      {text}.{" "}
      <Link
        href="/app/profile"
        className="font-medium text-guava-green underline-offset-2 hover:underline"
      >
        Open profile
      </Link>
    </p>
  );
}
