"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroMotion({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="mx-auto grid w-full max-w-2xl justify-items-center gap-5 text-center"
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.09, delayChildren: 0.08 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroLine({
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
              hidden: { opacity: 0, y: 18 },
              show: {
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 140,
                  damping: 20,
                  mass: 0.85,
                },
              },
            }
      }
    >
      {children}
    </motion.div>
  );
}

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
