"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/marketing/brand-mark";

const TAGLINE =
  "Honest applications · Real listings · Fit before you apply · You stay in control · ";

export function LandingFooter() {
  const reduce = useReducedMotion();

  return (
    <footer className="border-t border-guava-green/12 bg-[var(--footer-surface)]">
      <div
        className="overflow-hidden border-b border-guava-green/10 py-3"
        aria-hidden
      >
        <motion.div
          className="flex whitespace-nowrap font-mono text-[0.7rem] uppercase tracking-[0.28em] text-guava-green/70"
          animate={reduce ? undefined : { x: ["0%", "-50%"] }}
          transition={
            reduce
              ? undefined
              : { duration: 48, repeat: Infinity, ease: "linear" }
          }
        >
          <span className="px-4">{TAGLINE.repeat(4)}</span>
          <span className="px-4">{TAGLINE.repeat(4)}</span>
        </motion.div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:gap-10 sm:py-14 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="min-w-0 max-w-sm">
          <BrandMark />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The job platform for career changers and career growers. Honest
            applications, less busywork.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
          <Link
            href="/sign-up"
            className="inline-flex min-h-11 items-center font-medium text-foreground transition-colors hover:text-guava-green"
          >
            Get started
          </Link>
          <Link
            href="/jobs"
            className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-guava-green"
          >
            Browse jobs
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-guava-green"
          >
            Sign in
          </Link>
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-guava-green"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-guava-green"
          >
            Terms
          </Link>
        </nav>
      </div>
      <div className="border-t border-guava-green/10">
        <p className="mx-auto max-w-7xl px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-muted-foreground md:px-6">
          Job listings may include results powered by Adzuna. You review every
          application before you send it.
        </p>
      </div>
    </footer>
  );
}
