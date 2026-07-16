"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Subtle freemium "lives" meter: 5 free gens, not a fake countdown. */
export function QuotaPips() {
  const reduce = useReducedMotion();

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-guava-green"
            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 18,
              delay: i * 0.07,
            }}
          />
        ))}
      </div>
      <motion.p
        className="mt-3 font-mono text-xs tracking-wide text-guava-green"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        5 / 5 ready on Free
      </motion.p>
    </div>
  );
}
