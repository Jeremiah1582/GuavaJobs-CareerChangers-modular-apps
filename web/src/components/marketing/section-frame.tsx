import type { CSSProperties, ReactNode } from "react";
import { SoftOrb } from "@/components/marketing/hero-motion";

type Wash = "hero" | "mint" | "pink" | "plain";

const washes: Record<Wash, string | undefined> = {
  hero: "var(--wash-hero)",
  mint: "var(--wash-mint)",
  pink: "var(--wash-pink)",
  plain: undefined,
};

export function SectionFrame({
  children,
  wash = "plain",
  className = "",
  borderTone = "green",
  orbs = false,
  style,
}: {
  children: ReactNode;
  wash?: Wash;
  className?: string;
  borderTone?: "green" | "pink" | "neutral";
  orbs?: boolean;
  style?: CSSProperties;
}) {
  const border =
    borderTone === "pink"
      ? "border-guava-pink/15"
      : borderTone === "green"
        ? "border-guava-green/15"
        : "border-border";

  return (
    <section
      className={`relative overflow-hidden border-t ${border} ${className}`}
      style={{
        background: washes[wash],
        ...style,
      }}
    >
      {orbs ? (
        <>
          <SoftOrb className="left-[-6%] top-[12%] z-0 h-56 w-56 bg-guava-pink/12" />
          <SoftOrb className="right-[-4%] bottom-[8%] z-0 h-64 w-64 bg-guava-green/18" />
        </>
      ) : null}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
