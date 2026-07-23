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
 * Soft industry photo backdrop — one image at a time, skips failed loads.
 * Pauses on hover/focus and when reduced motion is preferred.
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
  const [paused, setPaused] = useState(false);

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
      setAvailable(
        results.filter((item): item is HeroIndustryImage => item != null),
      );
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [candidates]);

  const count = available.length;
  const shouldRotate = count >= 2 && !reduce && !paused;

  useEffect(() => {
    if (!shouldRotate) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [shouldRotate, count]);

  const onImgError = useCallback((src: string) => {
    setAvailable((prev) => prev.filter((item) => item.src !== src));
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
      className="pointer-events-auto absolute inset-0 z-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.img
          key={active.src}
          src={active.src}
          alt=""
          onError={() => onImgError(active.src)}
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{
            duration: reduce ? 0 : 0.9,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </AnimatePresence>

      <div
        className="absolute inset-0"
        style={{ background: "var(--hero-photo-scrim)" }}
      />
      <div
        className="absolute inset-0 opacity-55"
        style={{ background: "var(--hero-photo-wash)" }}
      />

      {count >= 2 && !reduce ? (
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="absolute bottom-6 right-6 rounded-md border border-white/20 bg-black/35 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-white/80 transition-colors hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          {paused ? "Play slides" : "Pause slides"}
        </button>
      ) : null}
    </div>
  );
}

export const HERO_INDUSTRY_CANDIDATES = CANDIDATES;
