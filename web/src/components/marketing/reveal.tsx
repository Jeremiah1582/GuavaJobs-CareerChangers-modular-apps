"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll reveal — use sparingly (hero / first fold only).
 * Set `animate={false}` for static sections below the fold.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  animate = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  animate?: boolean;
}) {
  const reduce = useReducedMotion();

  if (!animate || reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealStagger({
  children,
  className,
  animate = true,
}: {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}) {
  const reduce = useReducedMotion();

  if (!animate || reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={
        reduce
          ? undefined
          : {
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
              },
            }
      }
    >
      {children}
    </motion.div>
  );
}
