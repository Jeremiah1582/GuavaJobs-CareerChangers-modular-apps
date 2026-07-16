import type { ReactNode } from "react";
import { PaperPanel } from "@/components/ui/paper-panel";
import { Reveal } from "@/components/marketing/reveal";

export function AppPageShell({
  title,
  description,
  children,
  badge,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  badge?: ReactNode;
  /** Wider shell for letter + ATS review layouts */
  wide?: boolean;
}) {
  return (
    <main
      className={[
        "mx-auto px-4 py-10 md:px-6 md:py-12",
        wide ? "max-w-7xl" : "max-w-3xl",
      ].join(" ")}
    >
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-wide text-guava-pink">
              GuavaJobs
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground md:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {badge}
        </div>
      </Reveal>
      <div className="mt-8">{children}</div>
    </main>
  );
}

export function AppPlaceholderCard({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <PaperPanel className="border-guava-green/20 p-6 md:p-8">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </PaperPanel>
  );
}
