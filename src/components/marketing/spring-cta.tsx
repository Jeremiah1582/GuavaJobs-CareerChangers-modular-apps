"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";

type Variant = "pink" | "green" | "charcoal" | "ghost";

const styles: Record<Variant, string> = {
  pink: "bg-gradient-to-br from-[oklch(0.74_0.16_12)] via-[oklch(0.64_0.19_12)] to-[oklch(0.54_0.17_18)] text-white shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--guava-pink)_75%,transparent)] hover:brightness-[1.05]",
  green:
    "bg-gradient-to-br from-[oklch(0.68_0.13_150)] via-[oklch(0.58_0.16_150)] to-[oklch(0.48_0.13_155)] text-white shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--guava-green)_70%,transparent)] hover:brightness-[1.05]",
  charcoal:
    "bg-gradient-to-br from-[oklch(0.32_0.02_280)] to-[oklch(0.18_0.02_280)] text-primary-foreground shadow-[0_10px_28px_-14px_color-mix(in_oklab,var(--primary)_55%,transparent)] hover:brightness-110",
  ghost:
    "border border-guava-green/40 bg-gradient-to-br from-white/90 to-[oklch(0.97_0.02_150_/_0.85)] text-foreground backdrop-blur-sm hover:border-guava-green/65 hover:from-white hover:to-[oklch(0.96_0.03_150_/_0.95)]",
};

export function SpringCta({
  href,
  children,
  variant = "pink",
  withArrow = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  withArrow?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={`inline-flex ${className}`}
      whileHover={reduce ? undefined : { y: -2, scale: 1.015 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
    >
      <Link
        href={href}
        className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-[filter,border-color] duration-200 ${styles[variant]}`}
      >
        {children}
        {withArrow ? (
          <ArrowRight className="size-4" weight="regular" />
        ) : null}
      </Link>
    </motion.div>
  );
}
