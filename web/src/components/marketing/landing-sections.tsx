"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowSquareOut,
  Check,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { PaperPanel } from "@/components/ui/paper-panel";
import { Reveal } from "@/components/marketing/reveal";
import { QuotaPips } from "@/components/marketing/quota-pips";
import { SpringCta } from "@/components/marketing/spring-cta";
import { LoopRail, type LoopItem } from "@/components/marketing/loop-rail";

function FloatLayer({
  children,
  className,
  y = 6,
  duration = 9,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduce ? undefined : { y: [0, -y, 0] }}
      transition={
        reduce
          ? undefined
          : { duration, repeat: Infinity, ease: "easeInOut" }
      }
    >
      {children}
    </motion.div>
  );
}

/** Problem: honest stack vs generic hype — paper diorama. */
export function ProblemSection() {
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-12 md:items-center md:gap-14 md:px-6 md:py-28">
      <Reveal className="relative md:col-span-5">
        <div className="relative min-h-[320px] md:min-h-[380px]">
          <FloatLayer
            className="absolute left-0 top-4 z-10 w-[88%] rotate-[-2deg]"
            y={5}
          >
            <PaperPanel className="border-guava-pink/25 p-5 opacity-90">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-guava-pink">
                Generic generator
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground line-through decoration-guava-pink/50">
                  <X className="size-4 shrink-0 text-guava-pink" weight="bold" />
                  Invented leadership stories
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground line-through decoration-guava-pink/50">
                  <X className="size-4 shrink-0 text-guava-pink" weight="bold" />
                  One-size cover letter
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground line-through decoration-guava-pink/50">
                  <X className="size-4 shrink-0 text-guava-pink" weight="bold" />
                  Lost spreadsheet context
                </div>
              </div>
            </PaperPanel>
          </FloatLayer>

          <FloatLayer
            className="absolute bottom-0 right-0 z-20 w-[92%] rotate-[1.5deg]"
            y={7}
            duration={10}
          >
            <PaperPanel className="border-guava-green/30 p-5 md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-guava-green">
                GuavaJobs
              </p>
              <div className="mt-3 space-y-2.5">
                {[
                  "Transferable skills, framed honestly",
                  "Fit score against the real job",
                  "Every draft kept with snapshots",
                ].map((label, i) => (
                  <motion.div
                    key={label}
                    className="flex items-center gap-2.5 rounded-xl border border-guava-green/15 bg-white/60 px-3 py-2"
                    initial={reduce ? false : { opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 140,
                      damping: 20,
                      delay: i * 0.08,
                    }}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-guava-green text-white">
                      <Check className="size-3.5" weight="bold" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </PaperPanel>
          </FloatLayer>
        </div>
      </Reveal>

      <Reveal className="md:col-span-7" delay={0.08}>
        <p className="text-sm font-medium tracking-wide text-guava-pink">
          Why GuavaJobs
        </p>
        <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight md:text-4xl md:leading-[1.08]">
          Career change needs honesty, not hype.
        </h2>
        <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
          Generic generators invent experience. Spreadsheet trackers lose
          context. GuavaJobs frames transferable skills, scores{" "}
          <span className="font-medium text-guava-green">fit</span> against the
          real job, and keeps every draft with its snapshots.
        </p>
      </Reveal>
    </div>
  );
}

export function LoopSection({ items }: { items: readonly LoopItem[] }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
      <Reveal>
        <p className="text-sm font-medium tracking-wide text-guava-green">
          The loop
        </p>
        <h2 className="mt-2 max-w-xl text-balance text-2xl font-semibold tracking-tight md:text-4xl">
          Discover, generate, improve, apply, track.
        </h2>
        <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
          One calm loop from first search to a hired outcome. AI assists. You
          stay in control.
        </p>
      </Reveal>
      <LoopRail items={items} />
    </div>
  );
}

export function FreemiumSection() {
  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-12 md:items-center md:gap-14 md:px-6 md:py-28">
      <Reveal className="md:col-span-5">
        <FloatLayer y={8}>
          <PaperPanel className="relative overflow-hidden border-guava-green/25 p-8 md:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-guava-green/20 blur-2xl"
            />
            <p className="font-mono text-7xl font-semibold tracking-tight text-guava-green md:text-8xl">
              5
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              AI generations / month on Free
            </p>
            <QuotaPips />
          </PaperPanel>
        </FloatLayer>
      </Reveal>

      <Reveal className="md:col-span-7" delay={0.06}>
        <p className="text-sm font-medium tracking-wide text-guava-green">
          Free tier
        </p>
        <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight md:text-4xl">
          Free to start. Clear about the limit.
        </h2>
        <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
          Free includes five AI generations each month. Manual tracking stays
          unlimited. Paid raises the generation cap when you need more speed. No
          invented past, either way.
        </p>
        <div className="mt-8">
          <SpringCta href="/sign-up" variant="green" withArrow>
            Get started
          </SpringCta>
        </div>
      </Reveal>
    </div>
  );
}

export function ListingsSection() {
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-12 md:items-center md:gap-14 md:px-6 md:py-24">
      <Reveal className="md:col-span-7">
        <p className="text-sm font-medium tracking-wide text-guava-pink">
          Real listings
        </p>
        <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight md:text-3xl">
          Real listings, not a fake feed.
        </h2>
        <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
          Job search draws on live market data. Where Adzuna results appear in
          product, we show{" "}
          <span className="font-medium text-guava-green">Jobs by Adzuna</span>.
          You always leave GuavaJobs to finish the employer application.
        </p>
      </Reveal>

      <Reveal className="md:col-span-5" delay={0.08}>
        <FloatLayer y={6} duration={8}>
          <PaperPanel className="border-guava-green/20 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  Product Designer
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Remote · Full time
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-guava-green/30 bg-guava-green/10 px-2 py-0.5 text-[10px] font-medium text-guava-green">
                Jobs by Adzuna
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-guava-pink/10 px-2.5 py-1 text-[11px] font-medium text-guava-pink">
                Strong fit
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                Design systems
              </span>
            </div>
            <motion.div
              className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground"
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <MagnifyingGlass className="size-4 text-guava-green" weight="duotone" />
              Opens employer site
              <ArrowSquareOut className="size-3.5" weight="bold" />
            </motion.div>
          </PaperPanel>
        </FloatLayer>
      </Reveal>
    </div>
  );
}

export function ClosingSection() {
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-guava-pink/15 shadow-[0_32px_90px_-40px_color-mix(in_oklab,var(--guava-pink)_35%,transparent)]">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.97 0.035 12) 0%, oklch(0.96 0.025 90) 45%, oklch(0.93 0.05 150) 100%)",
            }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[min(720px,92%)] -translate-x-1/2"
            animate={reduce ? undefined : { y: [0, -4, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="absolute inset-x-[8%] bottom-0 top-[6%] rounded-t-full"
              style={{
                background:
                  "radial-gradient(ellipse 65% 90% at 50% 100%, oklch(1 0 0 / 0.5) 0%, transparent 72%)",
              }}
            />
          </motion.div>

          <div className="relative z-10 flex flex-col items-start gap-6 px-6 py-14 md:px-12 md:py-16">
            <h2 className="max-w-xl text-balance text-2xl font-semibold tracking-tight md:text-4xl">
              Ready for applications that sound like you?
            </h2>
            <p className="max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
              Your first honest package is a few taps away.
            </p>
            <SpringCta href="/sign-up" variant="green" withArrow>
              Get started
            </SpringCta>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
