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
  generationPollIntervalMs,
  GENERATION_STUCK_UI_MS,
  isGeneratingStatus,
  type ApplicationResponse,
  type MeResponse,
} from "@/api/types";
import { ApplyPanel } from "@/components/applications/apply-panel";
import { GenerationProgressBanner } from "@/components/app/generation-watch-provider";
import { AtsReportPanel } from "@/components/applications/ats-report-panel";
import { CoverLetterEditor } from "@/components/applications/cover-letter-editor";
import { GenerateCta } from "@/components/applications/generate-cta";
import {
  CvChoiceToggle,
  GenerateTailoredCvButton,
  GeneratedCvPanel,
} from "@/components/applications/generated-cv-panel";
import { HybridAiPanel } from "@/components/applications/hybrid-ai-panel";
import { JobDescriptionPanel } from "@/components/applications/job-description-panel";
import {
  ProgressRing,
  applicationProgressStages,
} from "@/components/applications/progress-ring";
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
import {
  requestGenerationNotificationPermission,
  unwatchGeneration,
  watchGeneration,
} from "@/lib/generation-watch";
import { getAccessToken } from "@/lib/session";

type DeskTab = "overview" | "letter" | "fit" | "cv" | "track";

function RegenerateConfirm({
  open,
  busy,
  includeCv,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  includeCv: boolean;
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
              This uses one AI generation credit and overwrites the{" "}
              {includeCv
                ? "cover letter, tailored CV, fit report, and job/profile/CV snapshots."
                : "cover letter, fit report, and job/profile/CV snapshots."}
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

/** Full pre-desk stacked materials — Overview mounts real panels, not summaries. */
function OverviewMaterials({
  app,
  showLetter,
  showAts,
  showCv,
  savePending,
  saveError,
  cvChoiceBusy,
  onSaveLetter,
  onCvChoiceChange,
  onApplicationUpdated,
}: {
  app: ApplicationResponse;
  showLetter: boolean;
  showAts: boolean;
  showCv: boolean;
  savePending: boolean;
  saveError: string | null;
  cvChoiceBusy: boolean;
  onSaveLetter: (next: string) => Promise<void>;
  onCvChoiceChange: (choice: "UPLOADED" | "GENERATED") => void;
  onApplicationUpdated?: (app: ApplicationResponse) => void;
}) {
  const isAi = app.generationMode === "AI";
  const completed = app.generationStatus === "COMPLETED";

  return (
    <div className="space-y-6">
      {showLetter ? (
        <CoverLetterEditor
          content={app.coverLetterContent ?? ""}
          edited={app.coverLetterEdited}
          saving={savePending}
          saveError={saveError}
          onSave={onSaveLetter}
        />
      ) : null}

      {showAts ? (
        app.atsReport ? (
          <AtsReportPanel
            applicationId={app.id}
            report={app.atsReport}
            careerEnrichments={app.careerEnrichments}
            onApplicationUpdated={onApplicationUpdated}
          />
        ) : isAi && completed ? (
          <PaperPanel className="border-guava-green/20 p-6">
            <h2 className="text-base font-semibold tracking-tight">
              Fit report
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No ATS report attached. Regenerate to produce a fresh fit
              assessment.
            </p>
          </PaperPanel>
        ) : null
      ) : null}

      {showCv ? (
        <GeneratedCvPanel
          app={app}
          cvChoice={app.cvChoice ?? "UPLOADED"}
          onCvChoiceChange={onCvChoiceChange}
          choiceBusy={cvChoiceBusy}
        />
      ) : null}

      <StatusAndEvents
        key={`${app.id}-${app.status}-${app.updatedAt}`}
        app={app}
      />
    </div>
  );
}

function DeskTabs({
  tab,
  onChange,
  showLetter,
  showFit,
  showCv,
}: {
  tab: DeskTab;
  onChange: (t: DeskTab) => void;
  showLetter: boolean;
  showFit: boolean;
  showCv: boolean;
}) {
  const items: { id: DeskTab; label: string; show: boolean }[] = [
    { id: "overview", label: "Overview", show: true },
    { id: "letter", label: "Letter", show: showLetter },
    { id: "fit", label: "Fit", show: showFit },
    { id: "cv", label: "CV", show: showCv },
    { id: "track", label: "Track", show: true },
  ];
  const visible = items.filter((i) => i.show);

  return (
    <div
      className="inline-flex flex-wrap gap-1 rounded-xl border border-guava-green/15 bg-white/80 p-1"
      role="tablist"
      aria-label="Application materials"
    >
      {visible.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={[
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-[0.98]",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function DeskSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-white/50" />
        <div className="h-14 w-40 animate-pulse rounded-xl bg-white/50" />
      </div>
      <div className="h-20 animate-pulse rounded-2xl border border-guava-green/10 bg-white/50" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="h-72 animate-pulse rounded-2xl border border-guava-green/10 bg-white/50" />
        <div className="h-64 animate-pulse rounded-2xl border border-guava-green/10 bg-white/50" />
      </div>
    </div>
  );
}

export function DraftReview({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient();
  const trackedTerminal = useRef<string | null>(null);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [cvChoiceBusy, setCvChoiceBusy] = useState(false);
  const [generatingSince, setGeneratingSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<DeskTab>("overview");

  const appQuery = useQuery({
    queryKey: ["application", applicationId] as const,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(`/applications/${applicationId}`, {
        token,
      });
    },
    refetchInterval: (q) => {
      if (!isGeneratingStatus(q.state.data?.generationStatus)) return false;
      const elapsed =
        generatingSince != null ? Date.now() - generatingSince : 0;
      return generationPollIntervalMs(elapsed);
    },
    retry: 1,
  });

  const meQuery = useQuery({
    queryKey: ["me"] as const,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<MeResponse>("/me", { token });
    },
    staleTime: 60_000,
  });

  const autoGenerateCv =
    meQuery.data?.preferences?.autoGenerateTailoredCv === true;

  useEffect(() => {
    if (appQuery.data) setHasApplicationsCookie(true);
  }, [appQuery.data]);

  useEffect(() => {
    const status = appQuery.data?.generationStatus;
    if (isGeneratingStatus(status)) {
      setGeneratingSince((prev) => prev ?? Date.now());
    } else {
      setGeneratingSince(null);
    }
  }, [appQuery.data?.generationStatus, appQuery.data?.updatedAt]);

  useEffect(() => {
    if (generatingSince == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 2000);
    return () => window.clearInterval(id);
  }, [generatingSince]);

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
      unwatchGeneration(app.id, "package");
      track(AnalyticsEvents.generate_completed, {
        applicationId: app.id,
        canonicalJobKey: app.canonicalJobKey,
      });
    } else {
      unwatchGeneration(app.id, "package");
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

  function syncApplication(data: ApplicationResponse) {
    queryClient.setQueryData(
      ["application", applicationId],
      (old: ApplicationResponse | undefined) => ({
        ...data,
        events: data.events ?? old?.events,
      }),
    );
  }

  async function handleCvChoiceChange(choice: "UPLOADED" | "GENERATED") {
    if (!app || app.cvChoice === choice) return;
    setCvChoiceBusy(true);
    try {
      const token = await getAccessToken();
      const data = await apiFetch<ApplicationResponse>(
        `/applications/${applicationId}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ cvChoice: choice }),
        },
      );
      queryClient.setQueryData(
        ["application", applicationId],
        (old: ApplicationResponse | undefined) => ({
          ...data,
          events: data.events ?? old?.events,
        }),
      );
    } finally {
      setCvChoiceBusy(false);
    }
  }

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
      setGeneratingSince(Date.now());
      void requestGenerationNotificationPermission();
      watchGeneration({
        id: data.id,
        kind: "package",
        title: applicationTitle(data),
      });
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
  const showLetter = !!app?.coverLetterContent || (completed && isAi);
  const showAts = !!app?.atsReport || (completed && isAi);
  const showCv =
    !!app?.cvSnapshot || !!app?.generatedCv || (completed && isAi) || isManual;
  const title = app ? applicationTitle(app) : "Application";
  const company = app ? applicationCompany(app) : null;
  const canRegen = isAi && (completed || failed) && !generating;
  const hasGenerated = !!app?.generatedCv?.content;
  // Matches worker: tailored CV only when pref on or actively selected GENERATED.
  const includeCvInPackage =
    autoGenerateCv || app?.cvChoice === "GENERATED";
  useEffect(() => {
    if (!app?.id || !generating) return;
    void requestGenerationNotificationPermission();
    watchGeneration({ id: app.id, kind: "package", title });
  }, [app?.id, generating, title]);

  const stuckMs = GENERATION_STUCK_UI_MS;
  const stuckGenerating =
    generatingSince != null && now - generatingSince >= stuckMs;
  const elapsedMs = generatingSince != null ? now - generatingSince : 0;

  useEffect(() => {
    if (!app) return;
    if (tab === "letter" && !showLetter) setTab("overview");
    else if (tab === "fit" && !showAts) setTab("overview");
    else if (tab === "cv" && !showCv) setTab("overview");
  }, [app, tab, showLetter, showAts, showCv]);

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
        <DeskSkeleton />
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
          {/* Compact job header + progress ring */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                  {title}
                </h1>
                <StatusChip status={app.status} />
              </div>
              {company ? (
                <p className="mt-0.5 text-base text-muted-foreground">
                  {company}
                </p>
              ) : null}
            </div>
            {!generating ? (
              <ProgressRing stages={applicationProgressStages(app)} />
            ) : null}
          </div>

          <JobDescriptionPanel
            app={app}
            canRegenerate={canRegen && !generating}
            onRequestRegenerate={() => setRegenOpen(true)}
          />

          {generating ? (
            <GenerationProgressBanner
              status={app.generationStatus ?? "PENDING"}
              elapsedMs={elapsedMs}
              includeCv={includeCvInPackage}
              stuck={stuckGenerating}
              retrying={regenMutation.isPending}
              onRetry={() => regenMutation.mutate()}
            />
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
                    Retry re-queues the same application without using an extra
                    credit when the prior attempt failed.
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

          <>
              {isManual && app.canonicalJobKey ? (
                <PaperPanel className="border-guava-pink/15 p-5 md:p-6">
                  <p className="text-sm font-medium text-foreground">
                    Generate application
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This listing is saved in your tracker. Generate uses one AI
                    credit and builds a letter plus fit notes from the job.
                  </p>
                  <div className="mt-4">
                    <GenerateCta canonicalJobKey={app.canonicalJobKey} />
                  </div>
                </PaperPanel>
              ) : null}

              {isManual ? <HybridAiPanel app={app} /> : null}

              {/* Desk: primary + sticky rail */}
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
                <div className="min-w-0 space-y-4">
                  <DeskTabs
                    tab={tab}
                    onChange={setTab}
                    showLetter={showLetter}
                    showFit={showAts}
                    showCv={showCv}
                  />

                  <div role="tabpanel">
                    {tab === "overview" ? (
                      <OverviewMaterials
                        app={app}
                        showLetter={showLetter}
                        showAts={showAts}
                        showCv={showCv}
                        savePending={saveMutation.isPending}
                        saveError={saveError}
                        cvChoiceBusy={cvChoiceBusy}
                        onSaveLetter={async (next) => {
                          await saveMutation.mutateAsync(next);
                        }}
                        onCvChoiceChange={(c) => void handleCvChoiceChange(c)}
                        onApplicationUpdated={syncApplication}
                      />
                    ) : null}

                    {tab === "letter" && showLetter ? (
                      <CoverLetterEditor
                        content={app.coverLetterContent ?? ""}
                        edited={app.coverLetterEdited}
                        saving={saveMutation.isPending}
                        saveError={saveError}
                        onSave={async (next) => {
                          await saveMutation.mutateAsync(next);
                        }}
                      />
                    ) : null}

                    {tab === "fit" && showAts ? (
                      app.atsReport ? (
                        <AtsReportPanel
                          applicationId={app.id}
                          report={app.atsReport}
                          careerEnrichments={app.careerEnrichments}
                          onApplicationUpdated={syncApplication}
                        />
                      ) : (
                        <PaperPanel className="border-guava-green/20 p-6">
                          <h2 className="text-base font-semibold tracking-tight">
                            Fit report
                          </h2>
                          <p className="mt-2 text-sm text-muted-foreground">
                            No ATS report attached. Regenerate to produce a
                            fresh fit assessment.
                          </p>
                        </PaperPanel>
                      )
                    ) : null}

                    {tab === "cv" && showCv ? (
                      <GeneratedCvPanel
                        app={app}
                        compactEmpty
                        cvChoice={app.cvChoice ?? "UPLOADED"}
                        onCvChoiceChange={(c) => void handleCvChoiceChange(c)}
                        choiceBusy={cvChoiceBusy}
                      />
                    ) : null}

                    {tab === "track" ? (
                      <StatusAndEvents
                        key={`${app.id}-${app.status}-${app.updatedAt}`}
                        app={app}
                      />
                    ) : null}
                  </div>
                </div>

                {/* Sticky rail */}
                <aside className="space-y-4 lg:sticky lg:top-6">
                  {showCv ? (
                    <PaperPanel className="border-guava-green/15 p-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        CV for apply
                      </p>
                      <CvChoiceToggle
                        cvChoice={app.cvChoice ?? "UPLOADED"}
                        hasGenerated={hasGenerated}
                        busy={cvChoiceBusy}
                        onCvChoiceChange={(c) => void handleCvChoiceChange(c)}
                      />
                    </PaperPanel>
                  ) : null}

                  <ApplyPanel app={app} />

                  {canRegen && !generating ? (
                    <button
                      type="button"
                      onClick={() => setRegenOpen(true)}
                      disabled={regenMutation.isPending}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-guava-green/25 bg-white/80 px-4 py-2.5 text-sm font-medium transition-colors hover:border-guava-green/45 active:scale-[0.98]"
                    >
                      <ArrowClockwise className="size-4" weight="bold" />
                      Regenerate
                    </button>
                  ) : null}

                  {!hasGenerated && (isAi || isManual) ? (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Optional
                      </p>
                      <GenerateTailoredCvButton app={app} />
                    </div>
                  ) : null}
                </aside>
              </div>
          </>
        </>
      ) : null}

      <RegenerateConfirm
        open={regenOpen}
        busy={regenMutation.isPending}
        includeCv={includeCvInPackage}
        onCancel={() => setRegenOpen(false)}
        onConfirm={() => regenMutation.mutate()}
      />
      <QuotaSheet open={quotaOpen} onClose={() => setQuotaOpen(false)} />
    </div>
  );
}
