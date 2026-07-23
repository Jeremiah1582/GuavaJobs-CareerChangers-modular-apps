"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type HeroIndustryImage = {
  src: string;
  alt: string;
};

const CANDIDATES: HeroIndustryImage[] = [
  {
    src: "/marketing/hero/trades.jpg",
    alt: "Utility workers surveying an electrical substation",
  },
  {
    src: "/marketing/hero/healthcare.jpg",
    alt: "Healthcare professional with a tablet in a clinic",
  },
  {
    src: "/marketing/hero/data-analyst.jpg",
    alt: "Data analyst reviewing charts across multiple monitors",
  },
  {
    src: "/marketing/hero/celebration.jpg",
    alt: "Office worker celebrating good news at her desk",
  },
  {
    src: "/marketing/hero/education.jpg",
    alt: "Educator smiling while mentoring learners in a classroom",
  },
  {
    src: "/marketing/hero/robotics.jpg",
    alt: "Robotics engineer adjusting a collaborative robot arm",
  },
  {
    src: "/marketing/hero/quantum.jpg",
    alt: "Engineer working on a quantum computing apparatus",
  },
  {
    src: "/marketing/hero/lab-research.jpg",
    alt: "Lab researcher examining specimens at a microscope",
  },
];

const ROTATE_MS = 7500;

/**
 * Soft industry photo backdrop — one image at a time, skips failed loads,
 * never leaves blank squares. Falls back to nothing (parent wash shows).
 */
export function HeroIndustryBackdrop({
  candidates = CANDIDATES,
}: {
  candidates?: HeroIndustryImage[];
}) {
  const reduce = useReducedMotion();
  const [available, setAvailable] = useState<HeroIndustryImage[]>([]);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const results = await Promise.all(
        candidates.map(
          (candidate) =>
            new Promise<HeroIndustryImage | null>((resolve) => {
              const img = new window.Image();
              img.onload = () => resolve(candidate);
              img.onerror = () => resolve(null);
              img.src = candidate.src;
            }),
        ),
      );
      if (cancelled) return;
      setAvailable(results.filter((item): item is HeroIndustryImage => item != null));
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [candidates]);

  const count = available.length;

  useEffect(() => {
    if (count < 2 || reduce) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [count, reduce]);

  const onImgError = useCallback((src: string) => {
    setAvailable((prev) => {
      const next = prev.filter((item) => item.src !== src);
      return next;
    });
  }, []);

  const active = useMemo(() => {
    if (count === 0) return null;
    return available[index % count] ?? available[0] ?? null;
  }, [available, count, index]);

  if (!ready || !active) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.img
          key={active.src}
          src={active.src}
          alt=""
          onError={() => onImgError(active.src)}
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduce ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </AnimatePresence>

      {/* Black transparent screen — photos stay atmospheric, not focal */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.18 0.02 280 / 0.62) 0%, oklch(0.12 0.02 280 / 0.72) 45%, oklch(0.16 0.04 12 / 0.68) 100%)",
        }}
      />
      {/* Soft Guava wash so brand colour still reads through */}
      <div
        className="absolute inset-0 opacity-55"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.55 0.14 12 / 0.35) 0%, transparent 42%, oklch(0.5 0.12 150 / 0.28) 100%)",
        }}
      />
    </div>
  );
}

export const HERO_INDUSTRY_CANDIDATES = CANDIDATES;
