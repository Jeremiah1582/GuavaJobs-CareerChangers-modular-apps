"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { SpringCta } from "@/components/marketing/spring-cta";

import { APPLY_GATE_COPY } from "@/lib/pending-job";

const GATE_COPY = APPLY_GATE_COPY;

type ApplyGateModalProps = {
  open: boolean;
  signUpHref: string;
  onClose: () => void;
};

export function ApplyGateModal({
  open,
  signUpHref,
  onClose,
}: ApplyGateModalProps) {
  const reduce = useReducedMotion();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-gate-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-guava-pink/20 bg-white p-6 shadow-[0_24px_60px_-28px_rgb(0_0_0_/_0.35)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close dialog"
        >
          <X className="size-4" weight="bold" />
        </button>

        <p className="text-xs font-medium uppercase tracking-widest text-guava-pink">
          Free account
        </p>
        <h2
          id="apply-gate-title"
          className="mt-2 text-balance text-xl font-semibold tracking-tight text-foreground"
        >
          {GATE_COPY}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Create an account, finish a short setup, and we will save this listing
          to your tracker so you can generate when you are ready.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SpringCta href={signUpHref} variant="pink" withArrow>
            Create free account
          </SpringCta>
          <Link
            href={`/sign-in?next=${encodeURIComponent("/onboarding")}`}
            className="text-center text-sm font-medium text-muted-foreground hover:text-guava-green sm:text-left"
          >
            I already have an account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export { GATE_COPY };
