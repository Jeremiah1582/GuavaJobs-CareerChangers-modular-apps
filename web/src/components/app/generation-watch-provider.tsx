"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, CircleNotch, WarningCircle, X } from "@phosphor-icons/react";
import { apiFetch } from "@/api/client";
import type { ApplicationResponse } from "@/api/types";
import { isGeneratingStatus } from "@/api/types";
import {
  listPendingGenerations,
  notifyGenerationComplete,
  unwatchGeneration,
  type PendingGeneration,
} from "@/lib/generation-watch";
import { getAccessToken } from "@/lib/session";

type BannerState =
  | { kind: "idle" }
  | { kind: "success"; row: PendingGeneration }
  | { kind: "failed"; row: PendingGeneration; message: string };

/**
 * Polls sessionStorage-tracked in-flight packages app-wide so users can
 * navigate away from the draft desk while generation continues.
 */
export function GenerationWatchProvider() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingGeneration[]>([]);
  const [banner, setBanner] = useState<BannerState>({ kind: "idle" });
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    function sync() {
      setPending(listPendingGenerations());
    }
    sync();
    window.addEventListener("gj-generation-watch", sync);
    return () => window.removeEventListener("gj-generation-watch", sync);
  }, []);

  useEffect(() => {
    if (pending.length === 0) return;

    let cancelled = false;

    async function pollOnce() {
      const token = await getAccessToken();
      for (const row of pending) {
        if (cancelled) return;
        try {
          const app = await apiFetch<ApplicationResponse>(
            `/applications/${row.id}`,
            { token },
          );
          queryClient.setQueryData(["application", row.id], app);

          if (isGeneratingStatus(app.generationStatus)) continue;

          if (notified.current.has(row.id)) continue;
          notified.current.add(row.id);
          unwatchGeneration(row.id);
          setPending(listPendingGenerations());

          if (app.generationStatus === "COMPLETED") {
            notifyGenerationComplete(row.title, row.id);
            setBanner({ kind: "success", row });
          } else if (app.generationStatus === "FAILED") {
            setBanner({
              kind: "failed",
              row,
              message:
                app.generationError ??
                "Something went wrong building this package.",
            });
          }
        } catch {
          // Transient network errors — keep watching.
        }
      }
    }

    void pollOnce();
    const id = window.setInterval(() => void pollOnce(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pending, queryClient]);

  if (banner.kind === "idle") return null;

  if (banner.kind === "success") {
    return (
      <div
        className="border-b border-guava-green/25 bg-guava-green/10 px-4 py-3 sm:px-6"
        role="status"
      >
        <div className="mx-auto flex max-w-6xl items-start gap-3">
          <CheckCircle
            className="mt-0.5 size-5 shrink-0 text-guava-green"
            weight="duotone"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Package ready — {banner.row.title}
            </p>
            <Link
              href={`/app/applications/${banner.row.id}`}
              className="mt-1 inline-block text-sm font-medium text-guava-green underline-offset-2 hover:underline"
            >
              Open draft review
            </Link>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setBanner({ kind: "idle" })}
            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" weight="bold" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border-b border-destructive/25 bg-destructive/5 px-4 py-3 sm:px-6"
      role="alert"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <WarningCircle
          className="mt-0.5 size-5 shrink-0 text-destructive"
          weight="duotone"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            Generation failed — {banner.row.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{banner.message}</p>
          <Link
            href={`/app/applications/${banner.row.id}`}
            className="mt-1 inline-block text-sm font-medium text-guava-green underline-offset-2 hover:underline"
          >
            Open draft to retry
          </Link>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setBanner({ kind: "idle" })}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" weight="bold" />
        </button>
      </div>
    </div>
  );
}

/** Compact inline banner for the draft desk while status is in-flight. */
export function GenerationProgressBanner({
  status,
  elapsedMs,
  includeCv,
  stuck,
  onRetry,
  retrying,
}: {
  status: string;
  elapsedMs: number;
  includeCv: boolean;
  stuck: boolean;
  onRetry: () => void;
  retrying: boolean;
}) {
  const background = elapsedMs >= 120_000;
  const message = background
    ? "Still generating in the background — browse Jobs or your tracker. We will notify you here when the package is ready."
    : includeCv
      ? "Building cover letter, tailored CV, and fit report. This can take a few minutes for longer job descriptions."
      : "Building cover letter and fit report. This can take a few minutes for longer job descriptions.";

  return (
    <PaperPanelLike className="border-guava-green/25 bg-guava-green/5 p-4 md:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <CircleNotch
          className="mt-0.5 size-5 shrink-0 animate-spin text-guava-pink"
          weight="bold"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {stuck ? "Still working on your package" : "Generating application"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {status} · {Math.max(1, Math.round(elapsedMs / 1000))}s
          </p>
        </div>
        {stuck ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-guava-green/30 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {retrying ? (
              <CircleNotch className="size-4 animate-spin" weight="bold" />
            ) : null}
            Retry
          </button>
        ) : null}
      </div>
    </PaperPanelLike>
  );
}

function PaperPanelLike({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border shadow-[0_12px_48px_-18px_rgb(0_0_0_/_0.08)] ${className}`}
    >
      {children}
    </div>
  );
}
