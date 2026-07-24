"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";

export type RoleChip = {
  label: string;
  query: string;
  Icon: Icon;
};

function ChipButton({
  chip,
  onSelect,
}: {
  chip: RoleChip;
  onSelect: (chip: RoleChip) => void;
}) {
  const ChipIcon = chip.Icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(chip)}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-guava-pink/18 bg-white/90 px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-[border-color,background-color] hover:border-guava-pink/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-guava-pink/50 active:scale-[0.98] sm:px-4"
    >
      <ChipIcon
        className="size-4 shrink-0 text-guava-pink"
        weight="duotone"
        aria-hidden
      />
      {chip.label}
    </button>
  );
}

function ChipRow({
  chips,
  reverse,
  paused,
  onSelect,
}: {
  chips: RoleChip[];
  reverse?: boolean;
  paused: boolean;
  onSelect: (chip: RoleChip) => void;
}) {
  const reduce = useReducedMotion();
  const doubled = [...chips, ...chips];
  const animate = !reduce && !paused;

  return (
    <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <motion.div
        className="flex shrink-0 gap-2.5 px-2"
        animate={
          animate
            ? { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }
            : undefined
        }
        transition={
          animate
            ? { duration: 42, repeat: Infinity, ease: "linear" }
            : undefined
        }
      >
        {doubled.map((chip, i) => (
          <ChipButton key={`${chip.label}-${i}`} chip={chip} onSelect={onSelect} />
        ))}
      </motion.div>
    </div>
  );
}

export function RoleChipMarquee({
  chips,
  onSelect,
}: {
  chips: RoleChip[];
  onSelect: (chip: RoleChip) => void;
}) {
  const [paused, setPaused] = useState(false);
  const rowA = chips.filter((_, i) => i % 2 === 0);
  const rowB = chips.filter((_, i) => i % 2 === 1);

  return (
    <div className="w-full min-w-0">
      {/* Touch-friendly static chips on small screens */}
      <div className="flex flex-wrap gap-2 md:hidden">
        {chips.map((chip) => (
          <ChipButton key={chip.label} chip={chip} onSelect={onSelect} />
        ))}
      </div>

      {/* Marquee on tablet+ */}
      <div
        className="hidden w-full flex-col gap-3 md:flex"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <ChipRow chips={rowA} paused={paused} onSelect={onSelect} />
        <ChipRow chips={rowB} reverse paused={paused} onSelect={onSelect} />
      </div>
    </div>
  );
}
