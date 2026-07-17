"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "@phosphor-icons/react";

const spring = { type: "spring" as const, stiffness: 90, damping: 18 };

function Float({
  children,
  x = 0,
  y = 8,
  duration = 4.5,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  x?: number;
  y?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={
        reduce ? undefined : { y: [0, -y, 0], x: [0, x, 0] }
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

/** Hero: letter package + fit orb (pink / green). */
export function HeroIllustration() {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden
      className="relative mx-auto aspect-square w-full max-w-md md:max-w-none"
    >
      <motion.div
        className="absolute inset-[8%] rounded-[2rem] bg-guava-green/20"
        initial={reduce ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...spring, delay: 0.1 }}
      />
      <motion.div
        className="absolute inset-[18%] rounded-[1.5rem] bg-guava-pink/20"
        initial={reduce ? false : { scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...spring, delay: 0.18 }}
      />

      <Float className="absolute left-[14%] top-[22%] w-[58%]" y={10} duration={5}>
        <motion.div
          className="rounded-2xl border border-guava-pink/30 bg-card p-4 shadow-[0_20px_50px_-24px_color-mix(in_oklab,var(--guava-pink)_55%,transparent)]"
          initial={reduce ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.25 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-guava-pink" />
            <span className="size-2.5 rounded-full bg-guava-green" />
            <span className="h-2 flex-1 rounded-full bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-[88%] rounded-full bg-guava-pink/40" />
            <div className="h-2.5 w-[72%] rounded-full bg-foreground/10" />
            <div className="h-2.5 w-[80%] rounded-full bg-guava-green/45" />
            <div className="h-2.5 w-[55%] rounded-full bg-foreground/10" />
          </div>
        </motion.div>
      </Float>

      <Float
        className="absolute bottom-[16%] right-[10%] w-[42%]"
        y={12}
        x={-4}
        duration={5.5}
        delay={0.4}
      >
        <motion.div
          className="rounded-2xl border border-guava-green/40 bg-card p-4 shadow-[0_18px_40px_-22px_color-mix(in_oklab,var(--guava-green)_60%,transparent)]"
          initial={reduce ? false : { y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.35 }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-guava-green">
                Fit
              </p>
              <p className="mt-1 text-sm font-semibold text-guava-green">
                Strong match
              </p>
            </div>
            <svg viewBox="0 0 48 48" className="size-12 text-guava-green">
              <circle
                cx="24"
                cy="24"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="4"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                pathLength={1}
                initial={reduce ? false : { strokeDasharray: "0 1" }}
                animate={{ strokeDasharray: "0.75 1" }}
                transition={{
                  duration: 1.4,
                  delay: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ rotate: -90, transformOrigin: "24px 24px" }}
              />
            </svg>
          </div>
        </motion.div>
      </Float>

      <Float
        className="absolute right-[18%] top-[14%]"
        y={6}
        duration={3.8}
        delay={0.2}
      >
        <motion.span
          className="flex size-12 items-center justify-center rounded-full bg-guava-green text-white shadow-lg"
          animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
          transition={
            reduce
              ? undefined
              : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <Check className="size-6" weight="bold" />
        </motion.span>
      </Float>
    </div>
  );
}

/** Problem section: honesty checklist illustration. */
export function HonestyIllustration() {
  const reduce = useReducedMotion();
  const rows = [
    { label: "Transferable skills", tone: "pink" as const },
    { label: "Honest fit score", tone: "green" as const },
    { label: "Tracked snapshots", tone: "green" as const },
  ];

  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-2xl border border-guava-green/30 bg-card p-6 shadow-[0_24px_60px_-28px_color-mix(in_oklab,var(--guava-green)_40%,transparent)] md:p-8"
    >
      <motion.div
        className="absolute -right-8 -top-8 size-36 rounded-full bg-guava-green/25 blur-2xl"
        animate={
          reduce ? undefined : { scale: [1, 1.15, 1], opacity: [0.4, 0.75, 0.4] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-10 -left-6 size-32 rounded-full bg-guava-pink/20 blur-2xl"
        animate={
          reduce
            ? undefined
            : { scale: [1.1, 1, 1.1], opacity: [0.35, 0.6, 0.35] }
        }
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative space-y-4">
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            className="flex items-center gap-3 rounded-xl border border-border/80 bg-background/80 px-4 py-3"
            initial={reduce ? false : { opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: i * 0.12 }}
          >
            <motion.span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${
                row.tone === "green" ? "bg-guava-green" : "bg-guava-pink"
              }`}
              animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
              transition={{
                duration: 2.4,
                delay: i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Check className="size-4" weight="bold" />
            </motion.span>
            <span className="text-sm font-medium text-foreground">
              {row.label}
            </span>
            <span
              className={`ml-auto h-1.5 w-16 rounded-full ${
                row.tone === "green" ? "bg-guava-green/55" : "bg-guava-pink/45"
              }`}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function GreenPulseMark() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className="inline-block size-2.5 rounded-full bg-guava-green"
      animate={
        reduce ? undefined : { scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }
      }
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
