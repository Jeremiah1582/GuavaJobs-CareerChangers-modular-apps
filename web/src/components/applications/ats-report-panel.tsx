"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CaretDown,
  Check,
  CheckCircle,
  CircleNotch,
  Lightbulb,
  ListNumbers,
  MagicWand,
  PencilSimple,
  Plus,
  SealWarning,
  Target,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

function scoreTone(score: number): {
  text: string;
  bar: string;
  soft: string;
  label: string;
} {
  if (score >= ATS_GOOD_SCORE_MIN) {
    return {
      text: "text-guava-green",
      bar: "bg-guava-green",
      soft: "bg-guava-green/12 border-guava-green/25",
      label: "Strong",
    };
  }
  if (score >= 45) {
    return {
      text: "text-foreground",
      bar: "bg-foreground/70",
      soft: "bg-muted/80 border-border",
      label: "Fair",
    };
  }
  return {
    text: "text-guava-pink",
    bar: "bg-guava-pink",
    soft: "bg-guava-pink/10 border-guava-pink/30",
    label: "Weak",
  };
}

function ScoreBoard({
  overall,
  letter,
  cv,
}: {
  overall: number;
  letter: number;
  cv: number;
}) {
  const overallTone = scoreTone(overall);
  const letterTone = scoreTone(letter);
  const cvTone = scoreTone(cv);

  return (
    <div
      className="rounded-2xl border border-guava-green/20 bg-guava-green/[0.04] p-4 sm:p-5"
      aria-label="Fit scores"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Overall fit
            </p>
            <TrafficLight score={overall} />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <p
              className={`font-mono text-5xl font-semibold tracking-tight tabular-nums leading-none sm:text-6xl ${overallTone.text}`}
            >
              {overall}
            </p>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${overallTone.soft} ${overallTone.text}`}
            >
              {overallTone.label}
            </span>
          </div>
          <div
            className="mt-3 h-2 w-full max-w-[12rem] overflow-hidden rounded-full bg-white/80"
            role="presentation"
          >
            <div
              className={`h-full rounded-full transition-[width] ${overallTone.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, overall))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-[14rem] sm:gap-4">
          <SecondaryScore score={letter} label="Letter" tone={letterTone} />
          <SecondaryScore score={cv} label="CV keywords" tone={cvTone} />
        </div>
      </div>
    </div>
  );
}

/** Compact traffic-light indicator (green / muted / pink). */
function TrafficLight({ score }: { score: number }) {
  const active =
    score >= ATS_GOOD_SCORE_MIN
      ? "green"
      : score >= 45
        ? "fair"
        : "pink";
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-hidden
      title={
        active === "green"
          ? "Strong fit"
          : active === "fair"
            ? "Fair fit"
            : "Weak fit"
      }
    >
      <span
        className={[
          "size-2 rounded-full",
          active === "green" ? "bg-guava-green" : "bg-guava-green/25",
        ].join(" ")}
      />
      <span
        className={[
          "size-2 rounded-full",
          active === "fair" ? "bg-foreground/55" : "bg-foreground/15",
        ].join(" ")}
      />
      <span
        className={[
          "size-2 rounded-full",
          active === "pink" ? "bg-guava-pink" : "bg-guava-pink/25",
        ].join(" ")}
      />
    </span>
  );
}

function SecondaryScore({
  score,
  label,
  tone,
}: {
  score: number;
  label: string;
  tone: ReturnType<typeof scoreTone>;
}) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tone.soft}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-2xl font-semibold tabular-nums leading-none ${tone.text}`}
      >
        {score}
      </p>
    </div>
  );
}

function ImproveTips({ items }: { items: string[] }) {
  const tips = items.map((t) => t.trim()).filter(Boolean).slice(0, 3);
  if (tips.length === 0) return null;
  return (
    <section className="rounded-2xl border border-guava-pink/20 bg-guava-pink/[0.04] p-4">
      <SectionHeader
        tone="caution"
        icon={<Lightbulb className="size-5" weight="duotone" />}
        title="What to improve"
      />
      <ol className="mt-3 space-y-2">
        {tips.map((tip, index) => (
          <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-foreground">
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-guava-pink/30 bg-guava-pink/10 font-mono text-xs font-semibold text-guava-pink"
              aria-hidden
            >
              {index + 1}
            </span>
            <span className="min-w-0 pt-0.5">{tip}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function coveragePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value >= 0 && value <= 1) return Math.round(value * 100);
  return Math.round(Math.min(100, Math.max(0, value)));
}

function formatDimensionLabel(key: string): string {
  return key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatIcpValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean).join(", ");
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "";
    return entries
      .map(([k, v]) => {
        if (typeof v === "string" || typeof v === "number") {
          return `${formatDimensionLabel(k)}: ${v}`;
        }
        if (Array.isArray(v)) return `${formatDimensionLabel(k)}: ${v.map(String).join(", ")}`;
        return null;
      })
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

type MatchTab = "match" | "want";

/**
 * Your match vs What they want + collapsed keyword channels (M4.5.4).
 */
function MatchInsightPanels({
  keywordCoverage,
  breakdown,
  icpMatch,
  missingKeywords,
}: {
  keywordCoverage: Record<string, number>;
  breakdown: Record<string, number>;
  icpMatch: Record<string, unknown>;
  missingKeywords: string[];
}) {
  const [tab, setTab] = useState<MatchTab>("match");

  const breakdownEntries = Object.entries(breakdown).filter(
    ([, value]) => typeof value === "number",
  );
  const coverageEntries = Object.entries(keywordCoverage);
  const icpEntries = Object.entries(icpMatch)
    .map(([key, value]) => ({ key, text: formatIcpValue(value) }))
    .filter((row) => row.text.trim().length > 0);

  const hasMatch =
    breakdownEntries.length > 0 || coverageEntries.some(([, v]) => coveragePercent(v) >= 50);
  const hasWant = icpEntries.length > 0 || missingKeywords.length > 0;

  if (!hasMatch && !hasWant && coverageEntries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-guava-green/15 bg-white/55">
        <div
          className="flex border-b border-border/70"
          role="tablist"
          aria-label="Fit details"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "match"}
            onClick={() => setTab("match")}
            className={[
              "flex-1 px-4 py-2.5 text-sm font-semibold tracking-tight transition-colors",
              tab === "match"
                ? "border-b-2 border-guava-green text-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Your match
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "want"}
            onClick={() => setTab("want")}
            className={[
              "flex-1 px-4 py-2.5 text-sm font-semibold tracking-tight transition-colors",
              tab === "want"
                ? "border-b-2 border-guava-pink text-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            What they want
          </button>
        </div>

        <div className="p-4" role="tabpanel">
          {tab === "match" ? (
            breakdownEntries.length > 0 ? (
              <ul className="space-y-2.5">
                {breakdownEntries.map(([key, value]) => {
                  const score = Math.round(value);
                  const tone = scoreTone(score);
                  return (
                    <li key={key} className="flex items-center gap-3">
                      <TrafficLight score={score} />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {formatDimensionLabel(key)}
                      </span>
                      <span
                        className={`font-mono text-sm font-semibold tabular-nums ${tone.text}`}
                      >
                        {score}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Dimension scores will appear here after the next fit refresh.
              </p>
            )
          ) : (
            <div className="space-y-4">
              {icpEntries.length > 0 ? (
                <dl className="divide-y divide-border/60">
                  {icpEntries.map(({ key, text }) => (
                    <div key={key} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/65">
                        {formatDimensionLabel(key)}
                      </dt>
                      <dd className="text-sm leading-relaxed text-foreground">
                        {text}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {missingKeywords.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/65">
                    Keywords they emphasize
                  </p>
                  <KeywordChips
                    items={missingKeywords}
                    empty="No keyword gaps flagged."
                  />
                </div>
              ) : null}
              {icpEntries.length === 0 && missingKeywords.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  No Ideal Candidate Profile details for this listing yet.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {coverageEntries.length > 0 ? (
        <details className="group rounded-2xl border border-guava-green/15 bg-white/50 open:bg-white/70">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold tracking-tight text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <Target className="size-4 text-guava-green" weight="duotone" />
              Keyword channels
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {coverageEntries.length}
              </span>
            </span>
            <CaretDown
              className="size-4 shrink-0 text-foreground/60 transition-transform group-open:rotate-180"
              weight="bold"
            />
          </summary>
          <ul className="space-y-2.5 border-t border-guava-green/10 px-4 py-4">
            {coverageEntries.map(([keyword, value]) => {
              const pct = coveragePercent(value);
              const tone = scoreTone(pct);
              return (
                <li key={keyword}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-medium text-foreground">
                      {keyword}
                    </span>
                    <span
                      className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${tone.text}`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  tone?: "positive" | "caution" | "info" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "text-guava-green"
      : tone === "caution"
        ? "text-guava-pink"
        : tone === "info"
          ? "text-guava-green"
          : "text-foreground";

  return (
    <div className="flex items-center gap-2">
      <span className={`shrink-0 ${toneClass}`} aria-hidden>
        {icon}
      </span>
      <h3 className={`text-base font-semibold tracking-tight ${toneClass}`}>
        {title}
      </h3>
    </div>
  );
}

function Callout({
  icon,
  title,
  children,
  variant = "info",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  variant?: "info" | "change";
}) {
  const shell =
    variant === "change"
      ? "border-guava-pink/25 bg-guava-pink/[0.06]"
      : "border-guava-green/25 bg-guava-green/[0.06]";
  const titleTone =
    variant === "change" ? "text-guava-pink" : "text-guava-green";

  return (
    <aside className={`rounded-2xl border px-4 py-3.5 ${shell}`}>
      <div className={`flex items-center gap-2 ${titleTone}`}>
        <span className="shrink-0" aria-hidden>
          {icon}
        </span>
        <p className="text-sm font-semibold tracking-tight">{title}</p>
      </div>
      <div className="mt-2 text-[0.95rem] leading-[1.6] text-foreground">
        {children}
      </div>
    </aside>
  );
}

function KeywordChips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return (
      <p className="mt-2 text-[0.95rem] leading-[1.6] text-foreground/75">
        {empty}
      </p>
    );
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="inline-flex max-w-full items-center rounded-lg border border-guava-pink/25 bg-guava-pink/10 px-2.5 py-1.5 text-sm font-medium leading-snug text-foreground"
        >
          <span className="truncate">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ActionSteps({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return (
      <p className="mt-2 text-[0.95rem] leading-[1.6] text-foreground/75">
        {empty}
      </p>
    );
  }

  return (
    <ol className="mt-3 space-y-3">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-guava-green/30 bg-guava-green/10 font-mono text-sm font-semibold text-guava-green"
            aria-hidden
          >
            {index + 1}
          </span>
          <p className="min-w-0 flex-1 pt-0.5 text-[0.95rem] leading-[1.6] text-foreground">
            {item}
          </p>
        </li>
      ))}
    </ol>
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
    <li className="rounded-xl border border-guava-pink/20 bg-white/70 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 flex-1 text-[0.95rem] font-medium leading-[1.55] text-foreground">
          {gapText}
        </span>
        {addressed ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setExpanded((v) => !v)}
            title="Edit your saved experience for this gap"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-guava-green/30 bg-guava-green/10 px-2.5 py-1.5 text-sm font-medium text-guava-green transition-colors hover:border-guava-green/50 hover:bg-guava-green/15 active:scale-[0.98] disabled:opacity-50"
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
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-guava-pink/30 bg-white px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-guava-pink/45 hover:bg-guava-pink/5 active:scale-[0.98] disabled:opacity-50"
          >
            <Plus className="size-3.5" weight="bold" />
            Add experience
          </button>
        )}
      </div>

      {expanded ? (
        <div className="mt-3 space-y-3 rounded-xl border border-guava-green/15 bg-guava-green/[0.03] p-3.5">
          <div className="rounded-lg border border-guava-green/10 bg-white/70 px-3 py-2.5">
            <p className="text-sm font-semibold text-foreground">Writing tips</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-[1.55] text-foreground/80">
              {WRITING_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold leading-[1.55] text-foreground">
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
                className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50 ${
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
                className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50 ${
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
            <div className="space-y-2.5 text-sm leading-[1.55] text-foreground/85">
              <p>
                Don&apos;t fabricate experience for this gap — honesty keeps
                interviews and ATS scores grounded in what you can defend.
              </p>
              {suggestedRoles.length > 0 ? (
                <p>
                  Consider roles that fit your CV today:{" "}
                  <span className="font-semibold text-foreground">
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
            <p className="text-sm leading-[1.55] text-foreground/85">
              Only add a certification you hold or are actively pursuing — never
              invent credentials. Prefer status like &ldquo;in progress&rdquo;
              with a real program name.
            </p>
          ) : null}

          {honesty === "yes" ? (
            <>
              <p className="text-sm leading-[1.55] text-foreground/85">
                {addressed
                  ? "Update the facts you saved — we will replace your previous answer on your career profile."
                  : "Add only facts you can back up. We save this to your career profile for future applications. Improve with AI is optional polish and uses your AI quota."}
              </p>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  Role / project{" "}
                  <span className="font-normal text-foreground/65">
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
                  className={`${paperInputClass} text-base sm:text-sm`}
                  placeholder="e.g. Frontend intern at Acme, or Capstone dashboard"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  Dates{" "}
                  <span className="font-normal text-foreground/65">
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
                  className={`${paperInputClass} text-base sm:text-sm`}
                  placeholder="e.g. 2021–2023 or Coursework"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  What you did{" "}
                  <span className="font-normal text-foreground/65">
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
                  className={`${paperInputClass} min-h-[4.5rem] resize-y text-base leading-[1.55] sm:text-sm`}
                  placeholder="e.g. Built weekly reports in Excel for a 6-person ops team…"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  Outcome{" "}
                  <span className="font-normal text-foreground/65">
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
                  className={`${paperInputClass} text-base sm:text-sm`}
                  placeholder="e.g. Cut reporting time by ~2 hours/week"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  Section{" "}
                  <span className="font-normal text-foreground/65">
                    (optional)
                  </span>
                </span>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  disabled={busy}
                  className={`${paperInputClass} text-base sm:text-sm`}
                >
                  <option value="">Not sure</option>
                  {CAREER_SECTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              {canImprove ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={busy || !role.trim()}
                    onClick={requestImprove}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/30 bg-white px-3 py-2 text-sm font-medium transition-colors hover:border-guava-green/50 hover:bg-guava-green/5 active:scale-[0.98] disabled:opacity-50"
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
                  <p className="text-sm leading-[1.55] text-foreground/70">
                    Optional — polishes your facts only (uses AI quota). You can
                    Save without it.
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-[1.55] text-foreground/70">
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
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-[1.55] text-guava-pink">
                  {improveWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : null}

              {polished !== null ? (
                <div className="space-y-2 rounded-lg border border-guava-green/20 bg-white/70 p-3">
                  <p className="text-sm font-semibold">AI suggestion</p>
                  <textarea
                    value={polishedEdit}
                    onChange={(e) => {
                      setPolishedEdit(e.target.value);
                      setUsingPolished(false);
                    }}
                    rows={4}
                    disabled={busy}
                    className={`${paperInputClass} min-h-[5rem] resize-y text-base leading-[1.55] sm:text-sm`}
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 active:scale-[0.98]"
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
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
  const nextSteps =
    report.actionableSteps.length > 0
      ? report.actionableSteps
      : report.suggestions;

  return (
    <PaperPanel className="relative border-guava-green/20 p-5 md:p-6">
      {showStale ? (
        <button
          type="button"
          disabled={refreshing}
          onClick={() => refreshMutation.mutate()}
          className="absolute right-3 top-3 z-10 inline-flex max-w-[min(100%-1.5rem,16rem)] items-center gap-1.5 rounded-lg border border-guava-pink/35 bg-guava-pink/10 px-2.5 py-1.5 text-left text-sm font-medium text-guava-pink shadow-sm transition-[opacity,transform] hover:bg-guava-pink/15 active:scale-[0.98] disabled:opacity-60"
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

      <header className={`space-y-1.5 ${showStale ? "pr-[min(100%,11rem)] sm:pr-44" : ""}`}>
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Fit &amp; ATS report
        </h2>
        <p className="max-w-prose text-sm leading-[1.55] text-foreground/75">
          Based on your CV — we never invent employers or skills
        </p>
      </header>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-5">
        <ScoreBoard
          overall={report.score}
          letter={report.letterScore ?? report.score}
          cv={report.cvScore ?? report.score}
        />

        <ImproveTips items={nextSteps} />

        {report.changeSummary?.trim() ? (
          <Callout
            variant="change"
            icon={<SealWarning className="size-4" weight="duotone" />}
            title="What changed"
          >
            {report.changeSummary.trim()}
          </Callout>
        ) : null}

        {report.careerSuggestion?.trim() ||
        (report.suggestedRoles && report.suggestedRoles.length > 0) ? (
          <Callout
            icon={<Lightbulb className="size-4" weight="duotone" />}
            title="Where your CV fits best"
          >
            {report.careerSuggestion?.trim() ||
              `Your CV is currently suited toward ${formatRoleList(report.suggestedRoles ?? [])} — consider applying for these roles to leverage your existing experience.`}
          </Callout>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          <section className="rounded-2xl border border-guava-green/25 bg-guava-green/[0.05] p-4">
            <SectionHeader
              tone="positive"
              icon={<CheckCircle className="size-5" weight="duotone" />}
              title="Strengths"
            />
            {report.strengths.length === 0 ? (
              <p className="mt-3 text-[0.95rem] leading-[1.6] text-foreground/75">
                No strengths listed for this package.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {report.strengths.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-[0.95rem] leading-[1.6] text-foreground"
                  >
                    <Check
                      className="mt-1 size-4 shrink-0 text-guava-green"
                      weight="bold"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-guava-pink/25 bg-guava-pink/[0.05] p-4">
            <SectionHeader
              tone="caution"
              icon={<WarningCircle className="size-5" weight="duotone" />}
              title="Gaps"
            />
            {report.gaps.length === 0 ? (
              <p className="mt-3 text-[0.95rem] leading-[1.6] text-foreground/75">
                No gaps called out — still review the letter before applying.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
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
          </section>
        </div>

        <MatchInsightPanels
          keywordCoverage={report.keywordCoverage ?? {}}
          breakdown={report.breakdown ?? {}}
          icpMatch={report.icpMatch ?? {}}
          missingKeywords={report.missingKeywords ?? []}
        />

        {nextSteps.length > 3 ? (
          <section className="rounded-2xl border border-guava-green/20 bg-white/55 p-4">
            <SectionHeader
              tone="info"
              icon={<ListNumbers className="size-5" weight="duotone" />}
              title="More next steps"
            />
            <ActionSteps
              items={nextSteps.slice(3)}
              empty="No next steps — polish the letter if anything feels off."
            />
          </section>
        ) : null}
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
