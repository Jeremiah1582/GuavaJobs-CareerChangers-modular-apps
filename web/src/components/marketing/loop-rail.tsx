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

export function LoopRail({ items }: { items: readonly LoopItem[] }) {
  const reduce = useReducedMotion();

  return (
    <motion.ol
      className="relative mt-12 space-y-0 border-t border-border"
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {items.map((item, index) => {
        const Icon = icons[item.icon];
        const greenTone = index % 2 === 1;
        return (
          <motion.li
            key={item.title}
            className="grid gap-3 border-b border-border py-8 md:grid-cols-[3rem_8rem_1fr] md:items-start md:gap-8"
            variants={
              reduce
                ? undefined
                : {
                    hidden: { opacity: 0, x: -12 },
                    show: {
                      opacity: 1,
                      x: 0,
                      transition: {
                        type: "spring",
                        stiffness: 160,
                        damping: 22,
                      },
                    },
                  }
            }
          >
            <div className="relative flex h-10 w-10 items-center justify-center">
              <motion.span
                aria-hidden
                className={`absolute inset-0 rounded-full ${
                  greenTone ? "bg-guava-green/20" : "bg-guava-pink/15"
                }`}
                initial={reduce ? false : { scale: 0.7, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.45 }}
              />
              <span
                className={`relative flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white ${
                  greenTone ? "bg-guava-green" : "bg-guava-pink"
                }`}
              >
                {index + 1}
              </span>
            </div>
            <div className="flex items-center gap-2 md:block">
              <Icon
                className={`size-5 md:mb-2 ${
                  greenTone ? "text-guava-green" : "text-guava-pink"
                }`}
                weight="duotone"
                aria-hidden
              />
              <h3 className="text-base font-semibold tracking-tight">
                {item.title}
              </h3>
            </div>
            <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground md:text-base">
              {item.body}
            </p>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
