import type { CSSProperties, ReactNode } from "react";

type Wash = "hero" | "mint" | "pink" | "plain" | "cool" | "ice";

const washes: Record<Wash, string | undefined> = {
  hero: "var(--wash-hero)",
  mint: "var(--wash-mint)",
  pink: "var(--wash-pink)",
  cool: "var(--wash-cool)",
  ice: "var(--wash-mint)",
  plain: undefined,
};

export function SectionFrame({
  children,
  wash = "plain",
  className = "",
  borderTone = "neutral",
  orbs: _orbs = false,
  style,
}: {
  children: ReactNode;
  wash?: Wash;
  className?: string;
  borderTone?: "green" | "pink" | "neutral";
  /** Retained for call-site compat; orbs dropped per design.md restraint. */
  orbs?: boolean;
  style?: CSSProperties;
}) {
  void _orbs;
  const border =
    borderTone === "neutral"
      ? "border-[var(--color-rule)]"
      : "border-[var(--color-rule)]";

  return (
    <section
      className={`relative flex min-h-[100dvh] min-h-[100svh] w-full flex-col overflow-hidden border-t ${border} ${className}`}
      style={{
        background: washes[wash] ?? "var(--color-paper)",
        ...style,
      }}
    >
      <div className="relative z-10 flex w-full flex-1 flex-col justify-center">
        {children}
      </div>
    </section>
  );
}
