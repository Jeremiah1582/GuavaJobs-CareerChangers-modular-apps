"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CircleNotch,
  MagicWand,
  PencilSimple,
  Plus,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type {
  AddressApplicationGapBody,
  ApplicationAtsReport,
  ApplicationResponse,
  CareerGapEnrichment,
  ImproveApplicationGapBody,
  ImproveApplicationGapResponse,
} from "@/api/types";
import { PaperPanel, paperInputClass } from "@/components/ui/paper-panel";
import { ATS_GOOD_SCORE_MIN, applicationTitle } from "@/lib/applications";
import { AnalyticsEvents, track } from "@/lib/analytics";
import {
  requestGenerationNotificationPermission,
  watchGeneration,
} from "@/lib/generation-watch";
import { useGenerationWatch } from "@/lib/use-generation-watch";
import {
  IMPROVE_WORD_MIN,
  composeGapAnswer,
  countWords,
  parseGapAnswer,
} from "@/lib/gap-answer";
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

const WRITING_TIPS = [
  "Name the place, role, or project",
  "Say what you did (use action verbs)",
  "Mention tools only if you used them",
  "Add a number or outcome if you have one",
] as const;

type HonestyChoice = "yes" | "no" | null;

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
  applicationId,
  gapText,
  gapKind,
  saved,
  saving,
  error,
  suggestedRoles,
  missingKeywords,
  onSave,
}: {
  applicationId: string;
  gapText: string;
  gapKind?: "keyword" | "evidence" | "cert" | "domain" | "seniority";
  saved?: CareerGapEnrichment;
  saving: boolean;
  error: string | null;
  suggestedRoles: string[];
  missingKeywords: string[];
  onSave: (body: AddressApplicationGapBody) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [honesty, setHonesty] = useState<HonestyChoice>(
    gapKind === "domain" && !saved ? "no" : null,
  );
  const [role, setRole] = useState("");
  const [dates, setDates] = useState("");
  const [details, setDetails] = useState("");
  const [outcome, setOutcome] = useState("");
  const [section, setSection] = useState("");
  const [polished, setPolished] = useState<string | null>(null);
  const [polishedEdit, setPolishedEdit] = useState("");
  const [usingPolished, setUsingPolished] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [improveWarnings, setImproveWarnings] = useState<string[]>([]);
  const addressed = !!saved;
  const wasSaving = useRef(false);
  const queryClient = useQueryClient();

  const detailsWordCount = countWords(details);
  const canImprove = detailsWordCount >= IMPROVE_WORD_MIN;
  const canSave =
    honesty === "yes" &&
    role.trim().length > 0 &&
    details.trim().length > 0;

  useEffect(() => {
    if (!expanded) return;
    const parsed = parseGapAnswer(saved?.answer ?? "");
    setRole(parsed.role);
    setDates(parsed.dates);
    setDetails(parsed.details);
    setOutcome(parsed.outcome);
    setSection(saved?.section ?? "");
    setHonesty(saved ? "yes" : gapKind === "domain" ? "no" : null);
    setPolished(null);
    setPolishedEdit("");
    setUsingPolished(false);
    setImproveError(null);
    setImproveWarnings([]);
  }, [expanded, saved?.answer, saved?.section, saved, gapKind]);

  useEffect(() => {
    if (wasSaving.current && !saving && !error) {
      setExpanded(false);
    }
    wasSaving.current = saving;
  }, [saving, error]);

  const improveMutation = useMutation({
    mutationFn: async (body: ImproveApplicationGapBody) => {
      const token = await getAccessToken();
      return apiFetch<ImproveApplicationGapResponse>(
        `/applications/${applicationId}/gaps/improve`,
        {
          method: "POST",
          token,
          body: JSON.stringify(body),
        },
      );
    },
    onMutate: () => {
      setImproveError(null);
      setImproveWarnings([]);
    },
    onSuccess: (data) => {
      setPolished(data.improvedAnswer);
      setPolishedEdit(data.improvedAnswer);
      setUsingPolished(false);
      setImproveWarnings(data.warnings ?? []);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      setImproveError(
        err instanceof ApiError
          ? err.message
          : "Could not improve this draft.",
      );
    },
  });

  function cancel() {
    setExpanded(false);
  }

  function submit() {
    if (!canSave) return;
    let answer: string;
    if (usingPolished && polishedEdit.trim()) {
      answer = polishedEdit.trim();
    } else {
      answer = composeGapAnswer({ role, dates, details, outcome });
    }
    if (!answer.trim()) return;
    onSave({
      gapText,
      answer: answer.trim(),
      ...(section ? { section } : {}),
    });
  }

  function requestImprove() {
    if (!canImprove || !role.trim()) return;
    const draft = composeGapAnswer({ role, dates, details, outcome });
    improveMutation.mutate({
      gapText,
      draft,
      ...(missingKeywords.length > 0 ? { missingKeywords } : {}),
    });
  }

  const busy = saving || improveMutation.isPending;

  return (
    <li className="list-item">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 flex-1 leading-relaxed">{gapText}</span>
        {addressed ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setExpanded((v) => !v)}
            title="Edit your saved experience for this gap"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-guava-green/30 bg-guava-green/10 px-2 py-1 text-xs font-medium text-guava-green transition-colors hover:border-guava-green/50 hover:bg-guava-green/15 active:scale-[0.98] disabled:opacity-50"
          >
            {expanded ? (
              <PencilSimple className="size-3.5" weight="bold" />
            ) : (
              <Check className="size-3.5" weight="bold" />
            )}
            {expanded ? "Editing" : "Addressed"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-guava-green/25 bg-white px-2 py-1 text-xs font-medium transition-colors hover:border-guava-green/45 active:scale-[0.98] disabled:opacity-50"
          >
            <Plus className="size-3.5" weight="bold" />
            Add experience
          </button>
        )}
      </div>

      {expanded ? (
        <div className="mt-2 space-y-2.5 rounded-xl border border-guava-green/15 bg-guava-green/[0.03] p-3">
          {/* Writing tips — always visible when expanded */}
          <div className="rounded-lg border border-guava-green/10 bg-white/60 px-2.5 py-2">
            <p className="text-xs font-medium text-foreground">Writing tips</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-muted-foreground">
              {WRITING_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          {/* Honesty gate */}
          <div>
            <p className="text-xs font-medium leading-relaxed text-foreground">
              Do you have real experience related to this (job, project,
              coursework, or volunteer)?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setHonesty("yes");
                  setImproveError(null);
                }}
                className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors active:scale-[0.98] disabled:opacity-50 ${
                  honesty === "yes"
                    ? "border-guava-green/40 bg-guava-green/15 text-guava-green"
                    : "border-guava-green/25 bg-white hover:border-guava-green/45"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setHonesty("no");
                  setPolished(null);
                  setUsingPolished(false);
                  setImproveError(null);
                  setImproveWarnings([]);
                }}
                className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors active:scale-[0.98] disabled:opacity-50 ${
                  honesty === "no"
                    ? "border-guava-pink/40 bg-guava-pink/10 text-guava-pink"
                    : "border-guava-green/25 bg-white hover:border-guava-green/45"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {honesty === "no" ? (
            <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                Don&apos;t fabricate experience for this gap — honesty keeps
                interviews and ATS scores grounded in what you can defend.
              </p>
              {suggestedRoles.length > 0 ? (
                <p>
                  Consider roles that fit your CV today:{" "}
                  <span className="font-medium text-foreground">
                    {formatRoleList(suggestedRoles)}
                  </span>
                  . You can still frame transferable skills on a different gap
                  if you have real evidence.
                </p>
              ) : (
                <p>
                  Look at &ldquo;Where your CV fits best&rdquo; above for roles
                  that match what you already have.
                </p>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={cancel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                <X className="size-3.5" weight="bold" />
                Close
              </button>
            </div>
          ) : null}

          {honesty === "yes" && gapKind === "cert" ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Only add a certification you hold or are actively pursuing — never
              invent credentials. Prefer status like &ldquo;in progress&rdquo;
              with a real program name.
            </p>
          ) : null}

          {honesty === "yes" ? (
            <>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {addressed
                  ? "Update the facts you saved — we will replace your previous answer on your career profile."
                  : "Add only facts you can back up. We save this to your career profile for future applications. Improve with AI is optional polish and uses your AI quota."}
              </p>

              <label className="block">
                <span className="mb-1 block text-xs font-medium">
                  Role / project{" "}
                  <span className="font-normal text-muted-foreground">
                    (required)
                  </span>
                </span>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setUsingPolished(false);
                  }}
                  disabled={busy}
                  className={`${paperInputClass} text-sm`}
                  placeholder="e.g. Frontend intern at Acme, or Capstone dashboard"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium">
                  Dates{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </span>
                <input
                  type="text"
                  value={dates}
                  onChange={(e) => {
                    setDates(e.target.value);
                    setUsingPolished(false);
                  }}
                  disabled={busy}
                  className={`${paperInputClass} text-sm`}
                  placeholder="e.g. 2021–2023 or Coursework"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium">
                  What you did{" "}
                  <span className="font-normal text-muted-foreground">
                    (required)
                  </span>
                </span>
                <textarea
                  value={details}
                  onChange={(e) => {
                    setDetails(e.target.value);
                    setUsingPolished(false);
                  }}
                  rows={3}
                  disabled={busy}
                  className={`${paperInputClass} min-h-[4.5rem] resize-y text-sm leading-relaxed`}
                  placeholder="e.g. Built weekly reports in Excel for a 6-person ops team…"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium">
                  Outcome{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </span>
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => {
                    setOutcome(e.target.value);
                    setUsingPolished(false);
                  }}
                  disabled={busy}
                  className={`${paperInputClass} text-sm`}
                  placeholder="e.g. Cut reporting time by ~2 hours/week"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium">
                  Section{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </span>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  disabled={busy}
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

              {/* Improve with AI — only after ≥10 words in What you did */}
              {canImprove ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={busy || !role.trim()}
                    onClick={requestImprove}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/30 bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:border-guava-green/50 hover:bg-guava-green/5 active:scale-[0.98] disabled:opacity-50"
                  >
                    {improveMutation.isPending ? (
                      <CircleNotch
                        className="size-3.5 animate-spin"
                        weight="bold"
                      />
                    ) : (
                      <MagicWand className="size-3.5" weight="bold" />
                    )}
                    Improve with AI
                  </button>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Optional — polishes your facts only (uses AI quota). You can
                    Save without it.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Write at least {IMPROVE_WORD_MIN} words in &ldquo;What you
                  did&rdquo; to unlock Improve with AI (
                  {detailsWordCount}/{IMPROVE_WORD_MIN}).
                </p>
              )}

              {improveError ? (
                <p className="text-sm text-destructive" role="alert">
                  {improveError}
                </p>
              ) : null}

              {improveWarnings.length > 0 ? (
                <ul className="list-disc space-y-1 pl-4 text-xs text-guava-pink">
                  {improveWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : null}

              {polished !== null ? (
                <div className="space-y-2 rounded-lg border border-guava-green/20 bg-white/70 p-2.5">
                  <p className="text-xs font-medium">AI suggestion</p>
                  <textarea
                    value={polishedEdit}
                    onChange={(e) => {
                      setPolishedEdit(e.target.value);
                      setUsingPolished(false);
                    }}
                    rows={4}
                    disabled={busy}
                    className={`${paperInputClass} min-h-[5rem] resize-y text-sm leading-relaxed`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || !polishedEdit.trim()}
                      onClick={() => setUsingPolished(true)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium active:scale-[0.98] disabled:opacity-50 ${
                        usingPolished
                          ? "bg-guava-green/20 text-guava-green"
                          : "border border-guava-green/25 bg-white"
                      }`}
                    >
                      <Check className="size-3.5" weight="bold" />
                      {usingPolished ? "Using this" : "Use this"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setPolished(null);
                        setPolishedEdit("");
                        setUsingPolished(false);
                        setImproveWarnings([]);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                    >
                      Keep original
                    </button>
                  </div>
                </div>
              ) : null}

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy || !canSave}
                  onClick={submit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50 active:scale-[0.98]"
                >
                  {saving ? (
                    <CircleNotch
                      className="size-3.5 animate-spin"
                      weight="bold"
                    />
                  ) : (
                    <Check className="size-3.5" weight="bold" />
                  )}
                  {addressed ? "Save changes" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={cancel}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                >
                  <X className="size-3.5" weight="bold" />
                  Cancel
                </button>
              </div>
            </>
          ) : null}

          {honesty === null ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={cancel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                <X className="size-3.5" weight="bold" />
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function AtsReportPanel({
  applicationId,
  report,
  careerEnrichments = [],
  onApplicationUpdated,
}: {
  applicationId: string;
  report: ApplicationAtsReport;
  careerEnrichments?: CareerGapEnrichment[];
  /** Called after gap save (or ATS refresh) so the parent can sync application state. */
  onApplicationUpdated?: (app: ApplicationResponse) => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const awaitingRefresh = useGenerationWatch(applicationId, "ats");
  const [savingGap, setSavingGap] = useState<string | null>(null);
  const [gapErrors, setGapErrors] = useState<Record<string, string>>({});

  const enrichmentByGap = useMemo(() => {
    const map = new Map<string, CareerGapEnrichment>();
    for (const e of careerEnrichments) {
      map.set(e.gapText, e);
    }
    return map;
  }, [careerEnrichments]);

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
      void requestGenerationNotificationPermission();
      watchGeneration({
        id: applicationId,
        kind: "ats",
        title: applicationTitle(data),
        baselineAt: report.assessedAt,
      });
      queryClient.setQueryData(["application", applicationId], data);
      onApplicationUpdated?.(data);
      track(AnalyticsEvents.generate_started, {
        applicationId,
        mode: "ats_refresh",
      });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
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
    onSuccess: (data) => {
      setSavingGap(null);
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
              : "Update fit report to rescore"}
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

      {report.changeSummary?.trim() ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {report.changeSummary.trim()}
        </p>
      ) : null}

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
              {report.gaps.map((gap) => {
                const detailed = report.gapsDetailed?.find(
                  (g) => g.text === gap,
                );
                return (
                  <GapItem
                    key={gap}
                    applicationId={applicationId}
                    gapText={gap}
                    gapKind={detailed?.kind}
                    saved={enrichmentByGap.get(gap)}
                    saving={savingGap === gap}
                    error={gapErrors[gap] ?? null}
                    suggestedRoles={report.suggestedRoles ?? []}
                    missingKeywords={report.missingKeywords ?? []}
                    onSave={(body) => addressGapMutation.mutate(body)}
                  />
                );
              })}
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
