import type { ReactNode } from "react";

const base =
  "rounded-2xl border border-white/80 bg-gradient-to-b from-white/90 via-white/75 to-white/55 shadow-[0_12px_48px_-18px_rgb(0_0_0_/_0.14)] backdrop-blur-[2px]";

export function PaperPanel({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "form";
}) {
  return <Tag className={`${base} ${className}`}>{children}</Tag>;
}

export const paperPanelClass = base;

export const paperInputClass =
  "w-full rounded-xl border border-guava-pink/15 bg-white/80 px-3 py-2.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-guava-green/45 focus:ring-2 focus:ring-guava-green/20";
