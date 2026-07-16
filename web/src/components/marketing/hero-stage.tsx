"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { ArrowRight, Check } from "@phosphor-icons/react";

/** Paper layer: gentle independent drift for depth. */
function Layer({
  children,
  className,
  x = 0,
  y = 0,
  duration = 8,
  delay = 0,
  style,
}: {
  children?: ReactNode;
  className?: string;
  x?: number;
  y?: number;
  duration?: number;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      animate={
        reduce
          ? undefined
          : {
              x: [0, x, 0, -x * 0.6, 0],
              y: [0, -y, 0, y * 0.5, 0],
            }
      }
      transition={
        reduce
          ? undefined
          : { duration, delay, repeat: Infinity, ease: "easeInOut" }
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * Full hero diorama: layers frame and deepen focus on the centered message.
 * Story (readable): Your skills → Honest fit → Stronger applications.
 */
export function HeroStage({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative isolate min-h-[min(720px,calc(100dvh-5.5rem))] w-full overflow-hidden rounded-2xl border border-guava-pink/15 shadow-[0_32px_90px_-40px_color-mix(in_oklab,var(--guava-pink)_35%,transparent),0_24px_60px_-36px_color-mix(in_oklab,var(--guava-green)_40%,transparent)] md:min-h-[min(640px,calc(100dvh-6rem))]"
      role="region"
      aria-label="GuavaJobs hero"
    >
      {/* L0 sky */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.97 0.035 12) 0%, oklch(0.96 0.025 90) 38%, oklch(0.93 0.05 150) 100%)",
        }}
      />

      {/* L1 far hills - deepest scenic layer */}
      <Layer
        className="pointer-events-none absolute inset-x-0 bottom-[22%] z-[1] h-[38%]"
        x={-8}
        y={2}
        duration={18}
      >
        <svg
          viewBox="0 0 1200 280"
          className="h-full w-full opacity-70"
          preserveAspectRatio="none"
        >
          <path
            d="M0 180 C160 110 280 150 420 120 C560 90 680 40 820 70 C960 100 1080 140 1200 110 L1200 280 L0 280 Z"
            fill="oklch(0.82 0.06 150 / 0.55)"
          />
        </svg>
      </Layer>

      {/* L2 nearer hills */}
      <Layer
        className="pointer-events-none absolute inset-x-0 bottom-[10%] z-[2] h-[42%]"
        x={10}
        y={4}
        duration={14}
        delay={0.4}
      >
        <svg
          viewBox="0 0 1200 300"
          className="h-full w-full drop-shadow-[0_12px_20px_rgb(0_0_0_/_0.1)]"
          preserveAspectRatio="none"
        >
          <path
            d="M0 200 C200 140 340 170 500 145 C660 120 780 70 940 100 C1080 125 1140 150 1200 140 L1200 300 L0 300 Z"
            fill="oklch(0.68 0.11 150)"
          />
        </svg>
      </Layer>

      {/* L3 spotlight arch - pulls eye to center */}
      <Layer
        className="pointer-events-none absolute left-1/2 top-[4%] z-[3] h-[70%] w-[min(920px,96%)] -translate-x-1/2"
        y={5}
        duration={12}
      >
        <div
          className="absolute inset-x-[6%] bottom-0 top-[4%] rounded-t-full"
          style={{
            background:
              "radial-gradient(ellipse 65% 90% at 50% 100%, oklch(1 0 0 / 0.55) 0%, oklch(0.78 0.12 12 / 0.28) 35%, oklch(0.75 0.1 150 / 0.12) 58%, transparent 75%)",
          }}
        />
        <div className="absolute inset-x-[10%] top-[2%] h-[78%] rounded-t-full border-[12px] border-b-0 border-white/40 shadow-[0_20px_50px_-20px_rgb(0_0_0_/_0.12)]" />
      </Layer>

      {/* L4 CENTER STAGE - main message sits above scenic layers */}
      <div className="relative z-20 mx-auto flex min-h-[min(720px,calc(100dvh-5.5rem))] max-w-3xl flex-col items-center justify-center px-5 pb-24 pt-14 text-center md:min-h-[min(640px,calc(100dvh-6rem))] md:px-8 md:pb-28 md:pt-16">
        <div className="w-full rounded-2xl bg-gradient-to-b from-white/80 via-white/55 to-white/20 px-4 py-6 shadow-[0_12px_48px_-18px_rgb(0_0_0_/_0.16)] backdrop-blur-[2px] md:px-8 md:py-8">
          {children}
        </div>
      </div>

      {/* Mobile meaning strip - clear product story under the message */}
      <Layer
        className="pointer-events-none absolute bottom-[12%] left-1/2 z-[22] w-[min(92%,340px)] -translate-x-1/2 lg:hidden"
        y={4}
        duration={9}
        delay={0.25}
      >
        <div className="flex items-stretch justify-center gap-1.5">
          <div className="flex-1 rounded-xl border border-white/80 bg-white/95 px-2 py-2 text-center shadow-md">
            <p className="text-[10px] font-semibold text-guava-pink">Your skills</p>
          </div>
          <div className="flex items-center">
            <ArrowRight className="size-3.5 text-guava-green" weight="bold" />
          </div>
          <div className="flex-1 rounded-xl border border-white/80 bg-white/95 px-2 py-2 text-center shadow-md">
            <p className="text-[10px] font-semibold text-guava-green">Honest fit</p>
          </div>
          <div className="flex items-center">
            <ArrowRight className="size-3.5 text-guava-pink" weight="bold" />
          </div>
          <div className="flex-1 rounded-xl border border-white/80 bg-white/95 px-2 py-2 text-center shadow-md">
            <p className="text-[10px] font-semibold text-guava-pink">Apply better</p>
          </div>
        </div>
      </Layer>

      {/* Desktop meaning cards - sit beside center stage */}
      <Layer
        className="pointer-events-none absolute bottom-[16%] left-[3%] z-[22] hidden w-[156px] lg:block xl:left-[5%] xl:w-[172px]"
        x={-10}
        y={8}
        duration={9}
        delay={0.2}
      >
        <div className="rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_18px_40px_-14px_rgb(0_0_0_/_0.3)]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-guava-pink xl:text-[11px]">
            Your skills
          </p>
          <div className="mt-2 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-guava-pink/40" />
            <div className="h-1.5 w-[88%] rounded-full bg-foreground/10" />
            <div className="h-1.5 w-[72%] rounded-full bg-foreground/10" />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            CV and profile, kept honest
          </p>
        </div>
      </Layer>

      <Layer
        className="pointer-events-none absolute bottom-[22%] left-1/2 z-[22] hidden -translate-x-1/2 lg:block"
        y={4}
        duration={10}
        delay={0.35}
      >
        <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/95 px-3 py-1 text-[11px] font-medium text-foreground shadow-md">
          Honest fit
          <ArrowRight className="size-3.5 text-guava-green" weight="bold" />
        </span>
      </Layer>

      <Layer
        className="pointer-events-none absolute bottom-[16%] right-[3%] z-[22] hidden w-[156px] lg:block xl:right-[5%] xl:w-[172px]"
        x={10}
        y={-8}
        duration={9.5}
        delay={0.5}
      >
        <div className="rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_18px_40px_-14px_rgb(0_0_0_/_0.3)]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-guava-green xl:text-[11px]">
            Roles that fit
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.68_0.13_150)] to-[oklch(0.52_0.15_150)] text-white shadow-md">
              <Check className="size-4" weight="bold" />
            </span>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Match before you apply
            </p>
          </div>
        </div>
      </Layer>

      {/* L6 foreground leaves - frame only, keep clear of CTAs */}
      <Layer
        className="pointer-events-none absolute -left-6 bottom-[-10%] z-[25] w-[36%] max-w-[240px] opacity-95 md:w-[30%]"
        x={-12}
        y={6}
        duration={10}
        delay={0.15}
      >
        <svg
          viewBox="0 0 220 200"
          className="h-auto w-full drop-shadow-[0_18px_24px_rgb(0_0_0_/_0.22)]"
        >
          <defs>
            <linearGradient id="fgG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.66 0.13 150)" />
              <stop offset="100%" stopColor="oklch(0.48 0.14 150)" />
            </linearGradient>
            <linearGradient id="fgP" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.17 12)" />
              <stop offset="100%" stopColor="oklch(0.54 0.18 12)" />
            </linearGradient>
          </defs>
          <path
            d="M10 200 C24 130 4 70 58 20 C74 70 52 120 70 200 Z"
            fill="url(#fgG)"
          />
          <path
            d="M55 200 C80 140 105 80 160 36 C145 95 118 140 110 200 Z"
            fill="url(#fgP)"
          />
          <path
            d="M100 200 C125 150 170 105 215 90 C190 135 165 165 150 200 Z"
            fill="url(#fgG)"
            opacity="0.9"
          />
        </svg>
      </Layer>

      <Layer
        className="pointer-events-none absolute -right-6 bottom-[-10%] z-[25] w-[34%] max-w-[220px] opacity-95 md:w-[28%]"
        x={12}
        y={5}
        duration={11}
        delay={0.45}
      >
        <svg
          viewBox="0 0 220 200"
          className="h-auto w-full drop-shadow-[0_18px_24px_rgb(0_0_0_/_0.22)]"
        >
          <defs>
            <linearGradient id="fgG2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.66 0.13 150)" />
              <stop offset="100%" stopColor="oklch(0.48 0.14 150)" />
            </linearGradient>
            <linearGradient id="fgP2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.17 12)" />
              <stop offset="100%" stopColor="oklch(0.54 0.18 12)" />
            </linearGradient>
          </defs>
          <path
            d="M210 200 C196 130 216 70 162 20 C146 70 168 120 150 200 Z"
            fill="url(#fgP2)"
          />
          <path
            d="M165 200 C140 140 115 80 60 36 C75 95 102 140 110 200 Z"
            fill="url(#fgG2)"
          />
          <path
            d="M120 200 C95 150 50 105 5 90 C30 135 55 165 70 200 Z"
            fill="url(#fgP2)"
            opacity="0.88"
          />
        </svg>
      </Layer>

      {/* Inner rim */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 rounded-2xl ring-1 ring-inset ring-white/45"
      />
    </div>
  );
}
