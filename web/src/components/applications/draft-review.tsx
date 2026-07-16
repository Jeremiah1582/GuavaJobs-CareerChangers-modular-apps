"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowClockwise,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiFetch, ApiError } from "@/api/client";
import {
  isGeneratingStatus,
  type ApplicationResponse,
} from "@/api/types";
import { ApplyPanel } from "@/components/applications/apply-panel";
import { AtsReportPanel } from "@/components/applications/ats-report-panel";
import { CoverLetterEditor } from "@/components/applications/cover-letter-editor";
import { HybridAiPanel } from "@/components/applications/hybrid-ai-panel";
import { QuotaSheet } from "@/components/applications/quota-sheet";
import { StatusAndEvents } from "@/components/applications/status-and-events";
import { StatusChip } from "@/components/applications/status-chip";
import { PaperPanel } from "@/components/ui/paper-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import {
  applicationCompany,
  applicationTitle,
  setHasApplicationsCookie,
} from "@/lib/applications";
import { getAccessToken } from "@/lib/session";

function GeneratingState({ status }: { status: string }) {
  return (
    <PaperPanel className="border-guava-green/20 p-8 text-center md:p-12">
      <span className="relative mx-auto flex size-3">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-guava-pink/40" />
        <span className="relative inline-flex size-3 rounded-full bg-guava-pink" />
      </span>
      <h2 className="mt-5 text-lg font-semibold tracking-tight">
        Building your package
      </h2>
      <p className="mx-auto mt-2 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
        Cover letter and fit report are generating from your profile and CV.
        This usually takes under a minute.
      </p>
      <p className="mt-4 font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {status}
      </p>
    </PaperPanel>
  );
}

function RegenerateConfirm({
  open,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 sm:items-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="regen-title"
            className="w-full max-w-md rounded-2xl border border-guava-pink/20 bg-white p-6 shadow-[0_24px_64px_-24px_rgb(0_0_0_/_0.28)]"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="regen-title" className="text-lg font-semibold tracking-tight">
              Regenerate this package?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This uses one AI generation credit and overwrites the cover
              letter, fit report, and job/profile/CV snapshots.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={busy}
                onClick={onConfirm}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy ? (
                  <CircleNotch className="size-4 animate-spin" weight="bold" />
                ) : (
                  <ArrowClockwise className="size-4" weight="bold" />
                )}
                Regenerate
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onCancel}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function DraftReview({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient();
  const trackedTerminal = useRef<string | null>(null);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const appQuery = useQuery({
    queryKey: ["application", applicationId] as const,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(`/applications/${applicationId}`, {
        token,
      });
    },
    refetchInterval: (q) =>
      isGeneratingStatus(q.state.data?.generationStatus) ? 2500 : false,
    retry: 1,
  });

  useEffect(() => {
    if (appQuery.data) setHasApplicationsCookie(true);
  }, [appQuery.data]);

  useEffect(() => {
    const app = appQuery.data;
    if (!app?.generationStatus) return;
    if (
      app.generationStatus !== "COMPLETED" &&
      app.generationStatus !== "FAILED"
    ) {
      return;
    }
    const key = `${app.id}:${app.generationStatus}:${app.updatedAt}`;
    if (trackedTerminal.current === key) return;
    trackedTerminal.current = key;

    if (app.generationStatus === "COMPLETED") {
      track(AnalyticsEvents.generate_completed, {
        applicationId: app.id,
        canonicalJobKey: app.canonicalJobKey,
      });
    } else {
      track(AnalyticsEvents.generate_failed, {
        applicationId: app.id,
        canonicalJobKey: app.canonicalJobKey,
        error: app.generationError,
      });
    }
  }, [appQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (coverLetterContent: string) => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(`/applications/${applicationId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          coverLetterContent,
          coverLetterEdited: true,
        }),
      });
    },
    onSuccess: (data) => {
      setSaveError(null);
      queryClient.setQueryData(
        ["application", applicationId],
        (old: ApplicationResponse | undefined) => ({
          ...data,
          events: data.events ?? old?.events,
        }),
      );
      void queryClient.invalidateQueries({
        queryKey: ["application", applicationId],
      });
      track(AnalyticsEvents.letter_edited, { applicationId: data.id });
    },
    onError: (err) => {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "Could not save. Try again.",
      );
    },
  });

  const regenMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(
        `/applications/${applicationId}/regenerate`,
        { method: "POST", token },
      );
    },
    onSuccess: (data) => {
      setRegenOpen(false);
      trackedTerminal.current = null;
      queryClient.setQueryData(["application", applicationId], data);
      track(AnalyticsEvents.generate_started, {
        applicationId: data.id,
        mode: "regenerate",
      });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      setRegenOpen(false);
      if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
        track(AnalyticsEvents.quota_hit, { source: "regenerate" });
        setQuotaOpen(true);
      }
    },
  });

  const app = appQuery.data;
  const generating = isGeneratingStatus(app?.generationStatus);
  const failed = app?.generationStatus === "FAILED";
  const completed = app?.generationStatus === "COMPLETED";
  const isManual = app?.generationMode === "MANUAL";
  const isAi = app?.generationMode === "AI";
  const showLetter =
    !!app?.coverLetterContent || (completed && isAi);
  const showAts = !!app?.atsReport;
  const title = app ? applicationTitle(app) : "Application";
  const company = app ? applicationCompany(app) : null;
  const canRegen = isAi && (completed || failed) && !generating;

  return (
    <div className="space-y-6">
      <Link
        href="/app/applications"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-guava-green"
      >
        <ArrowLeft className="size-4" weight="bold" />
        Back to tracker
      </Link>

      {appQuery.isLoading ? (
        <div
          className="h-64 animate-pulse rounded-2xl border border-guava-green/10 bg-white/50"
          aria-hidden
        />
      ) : appQuery.isError ? (
        <PaperPanel className="border-destructive/30 p-6">
          <p className="text-sm text-destructive" role="alert">
            {appQuery.error instanceof ApiError
              ? appQuery.error.message
              : "Could not load this application."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Return to the tracker and open another entry, or generate from Jobs.
          </p>
        </PaperPanel>
      ) : app ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {title}
                </h1>
                <StatusChip status={app.status} />
              </div>
              {company ? (
                <p className="mt-1 text-lg text-muted-foreground">{company}</p>
              ) : null}
              <p className="mt-2 text-sm text-muted-foreground">
                {isManual
                  ? "Manual tracker entry — apply and log progress here"
                  : "Review, apply externally, then track what happens next"}
              </p>
            </div>
            {canRegen ? (
              <button
                type="button"
                onClick={() => setRegenOpen(true)}
                disabled={regenMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-guava-green/25 bg-white/80 px-4 py-2.5 text-sm font-medium transition-colors hover:border-guava-green/45"
              >
                <ArrowClockwise className="size-4" weight="bold" />
                Regenerate
              </button>
            ) : null}
          </div>

          {generating ? (
            <GeneratingState status={app.generationStatus ?? "PENDING"} />
          ) : null}

          {failed && isAi ? (
            <PaperPanel className="border-destructive/30 p-6 md:p-8">
              <div className="flex gap-3">
                <WarningCircle
                  className="mt-0.5 size-5 shrink-0 text-destructive"
                  weight="duotone"
                />
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    Generation failed
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {app.generationError ||
                      "Something went wrong building this package."}{" "}
                    Retry uses one AI credit and rebuilds the letter and fit
                    report.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRegenOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    <ArrowClockwise className="size-4" weight="bold" />
                    Retry generation
                  </button>
                </div>
              </div>
            </PaperPanel>
          ) : null}

          {!generating ? (
            <>
              {isManual ? <HybridAiPanel app={app} /> : null}

              {(showLetter || showAts) && (
                <div className="grid gap-6 md:grid-cols-2 md:items-start">
                  {showLetter ? (
                    <CoverLetterEditor
                      content={app.coverLetterContent ?? ""}
                      edited={app.coverLetterEdited}
                      saving={saveMutation.isPending}
                      saveError={saveError}
                      onSave={async (next) => {
                        await saveMutation.mutateAsync(next);
                      }}
                    />
                  ) : (
                    <div />
                  )}
                  {showAts ? (
                    <AtsReportPanel report={app.atsReport!} />
                  ) : isAi && completed ? (
                    <PaperPanel className="border-guava-green/20 p-6">
                      <h2 className="text-base font-semibold tracking-tight">
                        Fit report
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        No ATS report attached. Regenerate to produce a fresh
                        fit assessment.
                      </p>
                    </PaperPanel>
                  ) : null}
                </div>
              )}

              <ApplyPanel app={app} />
              <StatusAndEvents key={`${app.id}-${app.status}-${app.updatedAt}`} app={app} />
            </>
          ) : null}
        </>
      ) : null}

      <RegenerateConfirm
        open={regenOpen}
        busy={regenMutation.isPending}
        onCancel={() => setRegenOpen(false)}
        onConfirm={() => regenMutation.mutate()}
      />
      <QuotaSheet open={quotaOpen} onClose={() => setQuotaOpen(false)} />
    </div>
  );
}
