"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";

type Variant = "pink" | "green" | "charcoal" | "ghost";

const styles: Record<Variant, string> = {
  pink: "bg-[var(--cta-pink)] text-white shadow-[var(--shadow-cta-pink)] hover:brightness-[1.04]",
  green:
    "bg-[var(--cta-green)] text-white shadow-[var(--shadow-cta-green)] hover:brightness-[1.04]",
  charcoal:
    "bg-[var(--cta-charcoal)] text-primary-foreground shadow-[var(--shadow-cta-charcoal)] hover:brightness-110",
  ghost:
    "border border-guava-green/40 bg-[var(--cta-ghost)] text-foreground hover:border-guava-green/65",
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
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-[filter,border-color] duration-200 ${styles[variant]} ${className}`}
    >
      {children}
      {withArrow ? (
        <ArrowRight className="size-4" weight="regular" />
      ) : null}
    </Link>
  );
}
