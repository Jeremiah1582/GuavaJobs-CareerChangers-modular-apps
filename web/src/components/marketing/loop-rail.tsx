"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Binoculars,
  CheckCircle,
  Lightning,
  PaperPlaneTilt,
  PencilSimple,
} from "@phosphor-icons/react";
import { PaperPanel } from "@/components/ui/paper-panel";

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
    <div className="relative mt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-guava-green/35 to-transparent lg:block"
      />

      <motion.ol
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.12 }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.09 } },
        }}
      >
        {items.map((item, index) => {
          const Icon = icons[item.icon];
          const greenTone = index % 2 === 1;

          return (
            <motion.li
              key={item.title}
              className="min-w-[min(280px,78vw)] snap-start lg:min-w-0"
              variants={
                reduce
                  ? undefined
                  : {
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          type: "spring",
                          stiffness: 150,
                          damping: 22,
                        },
                      },
                    }
              }
            >
              <motion.div
                animate={
                  reduce
                    ? undefined
                    : { y: index % 2 === 0 ? [0, -4, 0] : [0, 4, 0] }
                }
                transition={
                  reduce
                    ? undefined
                    : {
                        duration: 5 + index * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.15,
                      }
                }
              >
                <PaperPanel
                  className={`relative h-full p-5 ${
                    greenTone
                      ? "border-guava-green/25 lg:translate-y-3"
                      : "border-guava-pink/20 lg:-translate-y-2"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                        greenTone ? "bg-guava-green" : "bg-guava-pink"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <Icon
                      className={`size-5 ${
                        greenTone ? "text-guava-green" : "text-guava-pink"
                      }`}
                      weight="duotone"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </PaperPanel>
              </motion.div>
            </motion.li>
          );
        })}
      </motion.ol>
    </div>
  );
}
