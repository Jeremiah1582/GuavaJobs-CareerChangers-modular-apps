import type { CSSProperties, ReactNode } from "react";

type Wash = "pink" | "mint" | "blend" | "photo";

const washes: Record<Wash, string | undefined> = {
  pink: "var(--wash-landing-pink)",
  mint: "var(--wash-landing-mint)",
  blend: "var(--wash-landing-blend)",
  /** Fallback paper when photo backdrop fails to load any image. */
  photo: "var(--wash-landing-pink)",
};

export function LandingFullscreenSection({
  id,
  wash,
  children,
  className = "",
  style,
  "aria-label": ariaLabel,
}: {
  id?: string;
  wash: Wash;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={`relative flex min-h-[100dvh] min-h-[100svh] w-full max-w-[100vw] flex-col overflow-hidden ${className}`}
      style={{
        background: washes[wash],
        ...style,
      }}
    >
      {children}
    </section>
  );
}
