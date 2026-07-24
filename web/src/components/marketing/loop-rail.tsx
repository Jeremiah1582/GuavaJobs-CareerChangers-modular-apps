"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Binoculars,
  CheckCircle,
  Lightning,
  PaperPlaneTilt,
  PencilSimple,
} from "@phosphor-icons/react";

const icons = {
  Binoculars,
  Lightning,
  PencilSimple,
  PaperPlaneTilt,
  CheckCircle,
} as const;

export type LoopIconName = keyof typeof icons;

export type LoopItem = {
  title: string;
  body: string;
  icon: LoopIconName;
};

/** Narrative workflow rail — numbered stages, not equal feature cards. */
export function LoopRail({ items }: { items: readonly LoopItem[] }) {
  const reduce = useReducedMotion();

  return (
    <motion.ol
      className="mt-14 divide-y divide-guava-green/12 border-y border-guava-green/12"
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07 } },
      }}
    >
      {items.map((item, index) => {
        const Icon = icons[item.icon];
        const greenTone = index % 2 === 1;
        const num = String(index + 1).padStart(2, "0");

        return (
          <motion.li
            key={item.title}
            className="group grid min-w-0 gap-3 py-6 sm:gap-4 sm:py-7 md:grid-cols-12 md:items-baseline md:gap-8 md:py-9"
            variants={
              reduce
                ? undefined
                : {
                    hidden: { opacity: 0, y: 16 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 140,
                        damping: 22,
                      },
                    },
                  }
            }
          >
            <div className="flex min-w-0 items-center gap-3 md:col-span-2">
              <span
                className={`font-mono text-2xl font-semibold tracking-tighter md:text-3xl ${
                  greenTone ? "text-guava-green" : "text-guava-pink"
                }`}
              >
                {num}
              </span>
              <Icon
                className={`size-5 md:hidden ${
                  greenTone ? "text-guava-green" : "text-guava-pink"
                }`}
                weight="duotone"
                aria-hidden
              />
            </div>

            <div className="min-w-0 md:col-span-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon
                  className={`hidden size-5 shrink-0 md:block ${
                    greenTone ? "text-guava-green" : "text-guava-pink"
                  }`}
                  weight="duotone"
                  aria-hidden
                />
                <h3 className="min-w-0 text-lg font-semibold tracking-tight [overflow-wrap:anywhere]">
                  {item.title}
                </h3>
              </div>
            </div>

            <p className="min-w-0 max-w-[52ch] text-sm leading-relaxed text-muted-foreground md:col-span-7 md:text-base">
              {item.body}
            </p>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
