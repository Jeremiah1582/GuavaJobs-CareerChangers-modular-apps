"use client";

import type { ReactNode } from "react";
import { ArrowClockwise, WarningCircle, WifiSlash } from "@phosphor-icons/react";
import { PaperPanel } from "@/components/ui/paper-panel";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <PaperPanel className="border-guava-green/15 p-8 text-center md:p-10">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      {action ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>
      ) : null}
    </PaperPanel>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  nextAction,
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string;
  message: string;
  /** Named next step — never leave the user with a bare failure */
  nextAction?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <PaperPanel className="border-destructive/30 p-6 md:p-8">
      <div className="flex gap-3">
        <WarningCircle
          className="mt-0.5 size-5 shrink-0 text-destructive"
          weight="duotone"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-destructive" role="alert">
            {message}
          </p>
          {nextAction ? (
            <p className="mt-2 text-xs text-muted-foreground">{nextAction}</p>
          ) : null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-guava-green/25 bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-guava-green/45"
            >
              <ArrowClockwise className="size-4" weight="bold" />
              {retryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </PaperPanel>
  );
}

export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div
      className="flex items-center justify-center gap-2 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive"
      role="status"
    >
      <WifiSlash className="size-4" weight="bold" />
      You&apos;re offline — changes won&apos;t save until the connection returns.
    </div>
  );
}
