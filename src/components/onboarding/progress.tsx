"use client";

import { Check } from "@phosphor-icons/react";
import {
  ONBOARDING_STEPS,
  STEP_LABELS,
  type OnboardingStep,
} from "@/lib/onboarding";

export function OnboardingProgress({ step }: { step: OnboardingStep }) {
  const index = ONBOARDING_STEPS.indexOf(step);

  return (
    <ol className="flex flex-col gap-3">
      {ONBOARDING_STEPS.map((id, i) => {
        const active = i === index;
        const done = i < index;
        return (
          <li key={id} className="flex items-center gap-3">
            <span
              className={[
                "relative flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs",
                done
                  ? "bg-guava-green text-accent-foreground"
                  : active
                    ? "bg-guava-pink text-accent-foreground"
                    : "border border-border bg-card text-muted-foreground",
              ].join(" ")}
            >
              {done ? (
                <Check className="size-3.5" weight="bold" aria-hidden />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={[
                "text-sm",
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              ].join(" ")}
            >
              {STEP_LABELS[id]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
