"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type { ApplicationAtsReport, ApplicationResponse } from "@/api/types";
import { PaperPanel } from "@/components/ui/paper-panel";
import { ATS_GOOD_SCORE_MIN } from "@/lib/applications";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { getAccessToken } from "@/lib/session";

function ScoreRing({ score, label }: { score: number; label: string }) {
  const tone =
    score >= ATS_GOOD_SCORE_MIN
      ? "text-guava-green"
      : score >= 45
        ? "text-foreground"
        : "text-guava-pink";

  return (
    <div className="text-center">
      <p className={`font-mono text-3xl font-semibold tracking-tight ${tone}`}>
        {score}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function BulletList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AtsReportPanel({
  applicationId,
  report,
}: {
  applicationId: string;
  report: ApplicationAtsReport;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [awaitingRefresh, setAwaitingRefresh] = useState(false);
  const [assessedAtBaseline, setAssessedAtBaseline] = useState<string | null>(
    null,
  );

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(
        `/applications/${applicationId}/generate-ats-report`,
        { method: "POST", token },
      );
    },
    onSuccess: (data) => {
      setError(null);
      setAssessedAtBaseline(report.assessedAt);
      setAwaitingRefresh(true);
      queryClient.setQueryData(["application", applicationId], data);
      track(AnalyticsEvents.generate_started, {
        applicationId,
        mode: "ats_refresh",
      });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      setAwaitingRefresh(false);
      setAssessedAtBaseline(null);
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not refresh the fit report.",
      );
    },
  });

  // Poll until the report fingerprint is fresh (assessedAt moves / stale clears).
  useEffect(() => {
    if (!awaitingRefresh) return;
    const id = window.setInterval(() => {
      void queryClient.invalidateQueries({
        queryKey: ["application", applicationId],
      });
    }, 2500);
    return () => window.clearInterval(id);
  }, [awaitingRefresh, applicationId, queryClient]);

  useEffect(() => {
    if (!awaitingRefresh || !assessedAtBaseline) return;
    if (report.assessedAt !== assessedAtBaseline && report.stale !== true) {
      setAwaitingRefresh(false);
      setAssessedAtBaseline(null);
    }
  }, [
    awaitingRefresh,
    assessedAtBaseline,
    report.assessedAt,
    report.stale,
  ]);

  const refreshing = refreshMutation.isPending || awaitingRefresh;
  const showStale = report.stale === true || awaitingRefresh;

  return (
    <PaperPanel className="relative border-guava-green/20 p-5 md:p-6">
      {showStale ? (
        <button
          type="button"
          disabled={refreshing}
          onClick={() => refreshMutation.mutate()}
          className="absolute right-3 top-3 z-10 inline-flex max-w-[min(100%-1.5rem,16rem)] items-center gap-1.5 rounded-lg border border-guava-pink/35 bg-guava-pink/10 px-2.5 py-1.5 text-left text-xs font-medium text-guava-pink shadow-sm transition-[opacity,transform] hover:bg-guava-pink/15 active:scale-[0.98] disabled:opacity-60"
        >
          {refreshing ? (
            <CircleNotch className="size-3.5 shrink-0 animate-spin" weight="bold" />
          ) : (
            <WarningCircle className="size-3.5 shrink-0" weight="fill" />
          )}
          <span>
            {refreshing
              ? "Updating fit report…"
              : "click to update"}
          </span>
        </button>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-2 pr-2">
        <h2 className="text-base font-semibold tracking-tight">
          Fit &amp; ATS report
        </h2>
        <p className="text-xs text-muted-foreground">
          Based on your CV — we never invent employers or skills
        </p>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-3 gap-4 border-b border-guava-green/10 pb-6">
        <ScoreRing score={report.score} label="Overall fit" />
        <ScoreRing
          score={report.letterScore ?? report.score}
          label="Letter"
        />
        <ScoreRing score={report.cvScore ?? report.score} label="CV keywords" />
      </div>

      <div className="mt-6 space-y-6">
        {report.careerSuggestion?.trim() ||
        (report.suggestedRoles && report.suggestedRoles.length > 0) ? (
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              Where your CV fits best
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {report.careerSuggestion?.trim() ||
                `Your CV is currently suited toward ${formatRoleList(report.suggestedRoles ?? [])} — consider applying for these roles to leverage your existing experience.`}
            </p>
          </div>
        ) : null}
        <BulletList
          title="Strengths"
          items={report.strengths}
          empty="No strengths listed for this package."
        />
        <BulletList
          title="Gaps"
          items={report.gaps}
          empty="No gaps called out — still review the letter before applying."
        />
        <BulletList
          title="Missing keywords"
          items={report.missingKeywords}
          empty="No keyword gaps flagged."
        />
        <BulletList
          title="What to do next"
          items={
            report.actionableSteps.length > 0
              ? report.actionableSteps
              : report.suggestions
          }
          empty="No next steps — polish the letter if anything feels off."
        />
      </div>
    </PaperPanel>
  );
}

function formatRoleList(roles: string[]): string {
  if (roles.length === 0) return "roles that match your background";
  if (roles.length === 1) return roles[0]!;
  if (roles.length === 2) return `${roles[0]} and ${roles[1]}`;
  return `${roles.slice(0, -1).join(", ")}, and ${roles[roles.length - 1]}`;
}
