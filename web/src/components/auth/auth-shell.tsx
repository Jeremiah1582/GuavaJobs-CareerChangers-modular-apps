import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { SoftOrb } from "@/components/marketing/hero-motion";
import { PaperPanel } from "@/components/ui/paper-panel";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main
      className="relative flex min-h-[100dvh] flex-col overflow-hidden px-4 py-10"
      style={{ background: "var(--wash-hero)" }}
    >
      <SoftOrb className="left-[-8%] top-[8%] h-64 w-64 bg-guava-pink/15" />
      <SoftOrb className="right-[-6%] bottom-[12%] h-72 w-72 bg-guava-green/20" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <Link
          href="/"
          className="mb-8 inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-guava-green"
        >
          ← Back to home
        </Link>

        <PaperPanel className="border-guava-pink/15 px-6 py-8 md:px-8 md:py-10">
          <BrandMark className="text-xl" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="mt-8">{children}</div>
        </PaperPanel>
      </div>
    </main>
  );
}
