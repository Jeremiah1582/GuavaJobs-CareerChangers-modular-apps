"use client";

import {
  ArrowSquareOut,
  Check,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { PaperPanel } from "@/components/ui/paper-panel";
import { QuotaPips } from "@/components/marketing/quota-pips";
import { SpringCta } from "@/components/marketing/spring-cta";
import { LoopRail, type LoopItem } from "@/components/marketing/loop-rail";

const sectionHeading =
  "max-w-[18ch] min-w-0 text-balance text-[clamp(1.65rem,5.5vw,3rem)] font-semibold leading-[1.08] tracking-tight [overflow-wrap:anywhere]";

/** Asymmetric honesty band — left copy, right visual. */
export function HonestyStripSection() {
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-7xl gap-8 px-4 py-12 sm:gap-10 sm:py-16 md:grid-cols-12 md:items-end md:gap-12 md:px-6 md:py-20">
      <div className="min-w-0 md:col-span-7">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-guava-pink">
          01 — Honesty
        </p>
        <h2 className={`mt-4 ${sectionHeading}`}>
          Honestly generate your Job application in seconds without inventing your
          past.
        </h2>
      </div>
      <div className="min-w-0 md:col-span-5">
        <p className="max-w-[36ch] text-base leading-relaxed text-muted-foreground md:ml-auto md:text-right">
          Find roles that fit your unique background. apply less, get more
          interviews. Experience grounded in your CV, not a fantasy resume.
        </p>
      </div>
    </div>
  );
}

/** Problem: honest stack vs generic hype — paper diorama. */
export function ProblemSection() {
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-7xl gap-10 px-4 py-12 sm:gap-12 sm:py-16 md:grid-cols-12 md:items-center md:gap-16 md:px-6 md:py-20">
      <div className="relative order-2 min-w-0 md:order-1 md:col-span-5">
        <div className="relative min-h-[280px] overflow-hidden sm:min-h-[300px] md:min-h-[360px]">
          <div className="absolute left-0 top-2 z-10 w-[88%] max-w-full sm:w-[86%] sm:rotate-[-1.5deg]">
            <PaperPanel className="border-guava-pink/20 bg-white/80 p-4 opacity-90 shadow-[0_18px_40px_-28px_color-mix(in_oklab,var(--guava-pink)_40%,transparent)] sm:p-5">
              <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-guava-pink">
                Generic generator
              </p>
              <div className="mt-3 space-y-2">
                {[
                  "Invented leadership stories",
                  "One-size cover letter",
                  "Lost spreadsheet context",
                ].map((label) => (
                  <div
                    key={label}
                    className="flex items-start gap-2 text-sm text-muted-foreground line-through decoration-guava-pink/40"
                  >
                    <X
                      className="mt-0.5 size-4 shrink-0 text-guava-pink"
                      weight="bold"
                    />
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </PaperPanel>
          </div>

          <div className="absolute bottom-0 right-0 z-20 w-[92%] max-w-full sm:w-[90%] sm:rotate-[1deg]">
            <PaperPanel className="border-guava-green/25 bg-white/95 p-4 shadow-[0_20px_48px_-28px_color-mix(in_oklab,var(--guava-green)_45%,transparent)] sm:p-5 md:p-6">
              <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-guava-green">
                GuavaJobs
              </p>
              <div className="mt-3 space-y-2.5">
                {[
                  "Transferable skills, framed honestly",
                  "Fit score against the real job",
                  "Every draft kept with snapshots",
                ].map((label) => (
                  <div
                    key={label}
                    className="flex items-start gap-2.5 rounded-xl border border-guava-green/12 bg-[var(--panel-honest)] px-3 py-2"
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-guava-green text-white">
                      <Check className="size-3.5" weight="bold" />
                    </span>
                    <span className="min-w-0 text-sm font-medium text-foreground [overflow-wrap:anywhere]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </PaperPanel>
          </div>
        </div>
      </div>

      <div className="order-1 min-w-0 md:order-2 md:col-span-7">
        <h2 className={sectionHeading}>
          Career change needs honesty, not hype.
        </h2>
        <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted-foreground sm:mt-6">
          Generic generators invent experience. Spreadsheet trackers lose
          context. GuavaJobs frames transferable skills, scores{" "}
          <span className="font-medium text-guava-green">fit</span> against the
          real job, and keeps every draft with its snapshots.
        </p>
      </div>
    </div>
  );
}

export function LoopSection({ items }: { items: readonly LoopItem[] }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-12 sm:py-16 md:px-6 md:py-20">
      <div className="grid gap-6 sm:gap-8 md:grid-cols-12 md:items-end md:gap-12">
        <div className="min-w-0 md:col-span-7">
          <h2 className={sectionHeading}>
            Discover, generate, improve, apply, track.
          </h2>
        </div>
        <div className="min-w-0 md:col-span-5">
          <p className="max-w-[40ch] text-base leading-relaxed text-muted-foreground md:ml-auto">
            One calm loop from first search to a hired outcome. We assist. You
            stay in control — nothing ships until you say so.
          </p>
        </div>
      </div>
      <LoopRail items={items} />
    </div>
  );
}

/** Freemium + listings as one asymmetric proof band. */
export function ProofBandSection() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-12 sm:py-16 md:px-6 md:py-20">
      <div className="grid gap-12 md:grid-cols-12 md:gap-10">
        <div className="min-w-0 md:col-span-5">
          <h2 className="max-w-[14ch] min-w-0 text-balance text-[clamp(1.65rem,5vw,2.25rem)] font-semibold leading-[1.08] tracking-tight [overflow-wrap:anywhere]">
            Free to start. Clear about the limit.
          </h2>
          <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-muted-foreground sm:mt-5">
            Five AI generations each month on Free. Manual tracking stays
            unlimited. Paid raises the cap when you need more speed — no
            invented past, either way.
          </p>
          <div className="mt-6 sm:mt-8">
            <PaperPanel className="relative overflow-hidden border-guava-green/20 p-5 sm:p-7 md:p-8">
              <p className="font-mono text-6xl font-semibold tracking-tighter text-guava-green sm:text-7xl md:text-8xl">
                5
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                generations / month on Free
              </p>
              <QuotaPips />
            </PaperPanel>
          </div>
          <div className="mt-6 sm:mt-8">
            <SpringCta
              href="/sign-up"
              variant="green"
              withArrow
              className="w-full sm:w-auto"
            >
              Create free account
            </SpringCta>
          </div>
        </div>

        <div className="min-w-0 md:col-span-7 md:pt-16">
          <h2 className="max-w-[18ch] min-w-0 text-balance text-[clamp(1.65rem,5vw,2.25rem)] font-semibold leading-[1.08] tracking-tight [overflow-wrap:anywhere]">
            Live market data. You finish on the employer site.
          </h2>
          <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted-foreground sm:mt-5">
            Job search draws on live listings. Where Adzuna results appear, we
            show{" "}
            <span className="font-medium text-guava-green">Jobs by Adzuna</span>.
            GuavaJobs helps you prepare — the final apply always happens with
            the employer.
          </p>

          <div className="mt-8 max-w-md sm:mt-10">
            <PaperPanel className="border-guava-green/15 p-4 sm:p-5 shadow-[0_20px_50px_-30px_color-mix(in_oklab,var(--guava-green)_35%,transparent)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Product Designer
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Remote · Full time
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-guava-green/25 bg-guava-green/8 px-2 py-0.5 font-mono text-[0.65rem] font-medium text-guava-green">
                  Adzuna
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md bg-guava-pink/10 px-2.5 py-1 text-[11px] font-medium text-guava-pink">
                  Strong fit
                </span>
                <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                  Design systems
                </span>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                <MagnifyingGlass
                  className="size-4 shrink-0 text-guava-green"
                  weight="duotone"
                />
                <span className="whitespace-nowrap">Opens employer site</span>
                <ArrowSquareOut className="size-3.5 shrink-0" weight="bold" />
              </div>
            </PaperPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClosingSection() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-12 sm:py-16 md:px-6 md:py-20">
      <div className="grid gap-8 border-t border-guava-pink/15 pt-12 sm:gap-10 sm:pt-16 md:grid-cols-12 md:gap-8 md:pt-20">
        <div className="min-w-0 md:col-span-8">
          <h2 className={sectionHeading}>
            Ready for applications that sound like you?
          </h2>
          <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-muted-foreground sm:mt-5">
            Search a role, or upload a CV for market fit. Your first honest
            package is a few taps away.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <SpringCta
              href="/sign-up"
              variant="green"
              withArrow
              className="w-full sm:w-auto"
            >
              Get started free
            </SpringCta>
            <a
              href="#search"
              className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-guava-pink hover:underline sm:justify-start"
            >
              Back to search
            </a>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-3 md:col-span-4 md:items-end">
          <p className="font-mono text-xs tracking-wide text-muted-foreground">
            No invented past
          </p>
          <p className="font-mono text-xs tracking-wide text-muted-foreground">
            You review before send
          </p>
          <p className="font-mono text-xs tracking-wide text-muted-foreground">
            Real listings only
          </p>
        </div>
      </div>
    </div>
  );
}
