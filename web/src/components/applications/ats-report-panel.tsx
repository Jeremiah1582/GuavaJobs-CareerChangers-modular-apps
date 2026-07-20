"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CircleNotch, Plus, WarningCircle, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type {
  AddressApplicationGapBody,
  ApplicationAtsReport,
  ApplicationResponse,
} from "@/api/types";
import { PaperPanel, paperInputClass } from "@/components/ui/paper-panel";
import { ATS_GOOD_SCORE_MIN } from "@/lib/applications";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { getAccessToken } from "@/lib/session";

const CAREER_SECTIONS = [
  { value: "work", label: "Work experience" },
  { value: "education", label: "Education" },
  { value: "skills", label: "Skills" },
  { value: "projects", label: "Projects" },
  { value: "certificates", label: "Certificates" },
  { value: "volunteer", label: "Volunteer" },
  { value: "awards", label: "Awards" },
  { value: "languages", label: "Languages" },
] as const;

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

function GapItem({
  gapText,
  addressed,
  saving,
  error,
  onSave,
}: {
  gapText: string;
  addressed: boolean;
  saving: boolean;
  error: string | null;
  onSave: (body: AddressApplicationGapBody) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState("");
  const [section, setSection] = useState("");

  function cancel() {
    setExpanded(false);
    setAnswer("");
    setSection("");
  }

  function submit() {
    const trimmed = answer.trim();
    if (!trimmed) return;
    onSave({
      gapText,
      answer: trimmed,
      ...(section ? { section } : {}),
    });
  }

  return (
    <li className="list-item">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 flex-1 leading-relaxed">{gapText}</span>
        {addressed ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-guava-green/30 bg-guava-green/10 px-2 py-1 text-xs font-medium text-guava-green">
            <Check className="size-3.5" weight="bold" />
            Addressed
          </span>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-guava-green/25 bg-white px-2 py-1 text-xs font-medium transition-colors hover:border-guava-green/45 active:scale-[0.98] disabled:opacity-50"
          >
            <Plus className="size-3.5" weight="bold" />
            Add experience
          </button>
        )}
      </div>

      {expanded && !addressed ? (
        <div className="mt-2 space-y-2.5 rounded-xl border border-guava-green/15 bg-guava-green/[0.03] p-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Add only facts you can back up — role, employer, dates, and what you
            did. We save this to your career profile for future applications.
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Details</span>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={3}
              disabled={saving}
              className={`${paperInputClass} min-h-[4.5rem] resize-y text-sm leading-relaxed`}
              placeholder="e.g. Led weekly standups for a 6-person team at Acme, 2021–2023…"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">
              Section{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </span>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={saving}
              className={`${paperInputClass} text-sm`}
            >
              <option value="">Not sure</option>
              {CAREER_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={saving || !answer.trim()}
              onClick={submit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? (
                <CircleNotch className="size-3.5 animate-spin" weight="bold" />
              ) : (
                <Check className="size-3.5" weight="bold" />
              )}
              Save
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={cancel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              <X className="size-3.5" weight="bold" />
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function AtsReportPanel({
  applicationId,
  report,
  onApplicationUpdated,
}: {
  applicationId: string;
  report: ApplicationAtsReport;
  /** Called after gap save (or ATS refresh) so the parent can sync application state. */
  onApplicationUpdated?: (app: ApplicationResponse) => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [awaitingRefresh, setAwaitingRefresh] = useState(false);
  const [assessedAtBaseline, setAssessedAtBaseline] = useState<string | null>(
    null,
  );
  const [addressedGaps, setAddressedGaps] = useState<Set<string>>(
    () => new Set(),
  );
  const [savingGap, setSavingGap] = useState<string | null>(null);
  const [gapErrors, setGapErrors] = useState<Record<string, string>>({});

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
      onApplicationUpdated?.(data);
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

  const addressGapMutation = useMutation({
    mutationFn: async (body: AddressApplicationGapBody) => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(
        `/applications/${applicationId}/gaps/address`,
        {
          method: "POST",
          token,
          body: JSON.stringify(body),
        },
      );
    },
    onMutate: (body) => {
      setSavingGap(body.gapText);
      setGapErrors((prev) => {
        const next = { ...prev };
        delete next[body.gapText];
        return next;
      });
    },
    onSuccess: (data, body) => {
      setSavingGap(null);
      setAddressedGaps((prev) => new Set(prev).add(body.gapText));
      queryClient.setQueryData(["application", applicationId], data);
      onApplicationUpdated?.(data);
    },
    onError: (err, body) => {
      setSavingGap(null);
      setGapErrors((prev) => ({
        ...prev,
        [body.gapText]:
          err instanceof ApiError
            ? err.message
            : "Could not save this experience.",
      }));
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
      // Fresh report — clear local addressed markers so gaps reflect new scoring.
      setAddressedGaps(new Set());
      setGapErrors({});
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
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Gaps</h3>
          {report.gaps.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No gaps called out — still review the letter before applying.
            </p>
          ) : (
            <ul className="mt-2 list-disc space-y-3 pl-5 text-sm text-muted-foreground">
              {report.gaps.map((gap) => (
                <GapItem
                  key={gap}
                  gapText={gap}
                  addressed={addressedGaps.has(gap)}
                  saving={savingGap === gap}
                  error={gapErrors[gap] ?? null}
                  onSave={(body) => addressGapMutation.mutate(body)}
                />
              ))}
            </ul>
          )}
        </div>
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
