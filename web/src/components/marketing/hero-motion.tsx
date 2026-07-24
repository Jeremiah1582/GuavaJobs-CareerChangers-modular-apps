"use client";

import { motion, useReducedMotion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

export function SoftOrb({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${className ?? ""}`}
      animate={
        reduce
          ? undefined
          : {
              scale: [1, 1.08, 1],
              opacity: [0.35, 0.55, 0.35],
            }
      }
      transition={
        reduce ? undefined : { duration: 8, repeat: Infinity, ease }
      }
    />
  );
}
