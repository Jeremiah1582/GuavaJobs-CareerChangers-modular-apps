"use client";

import {
  ArrowClockwise,
  CircleNotch,
  MagnifyingGlass,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type { MarketFitResponse } from "@/api/types";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { formatSalary } from "@/lib/jobs";
import { PaperPanel } from "@/components/ui/paper-panel";

const GUAVA_CARD =
  "bg-gradient-to-br from-[oklch(0.68_0.13_150)] via-[oklch(0.55_0.15_150)] to-[oklch(0.42_0.12_155)] text-white shadow-[0_14px_36px_-14px_color-mix(in_oklab,var(--guava-green)_75%,transparent)]";

type MarketFitRole = MarketFitResponse["roles"][number];

function fallbackMatchScore(role: MarketFitRole): number {
  if (role.matchScore != null) return role.matchScore;
  if (role.fitLevel === "strong") return 88;
  if (role.fitLevel === "adjacent") return 68;
  return 48;
}

function fitBadgeLabel(role: MarketFitRole): string {
  const score = fallbackMatchScore(role);
  if (role.fitLevel === "strong") return `${score}% strong`;
  if (role.fitLevel === "adjacent") return "Adjacent";
  return "Stretch";
}

function jobsSearchHref(cta: MarketFitRole["searchCta"]): string {
  const params = new URLSearchParams();
  params.set("q", cta.q);
  params.set("country", cta.country);
  if (cta.location?.trim()) params.set("where", cta.location.trim());
  return `/app/jobs?${params.toString()}`;
}

function FitBadge({ role }: { role: MarketFitRole }) {
  const isStrong = role.fitLevel === "strong";
  return (
    <span
      className={[
        "inline-flex rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
        isStrong
          ? "bg-black text-white"
          : "bg-white/10 text-white/90",
      ].join(" ")}
    >
      {fitBadgeLabel(role)}
    </span>
  );
}

function MarketFitRoleCard({
  role,
  expanded,
  onToggle,
}: {
  role: MarketFitRole;
  expanded: boolean;
  onToggle: () => void;
}) {
  const band = role.salary
    ? formatSalary(role.salary.min, role.salary.max, role.salary.currency)
    : null;

  if (expanded) {
    return (
      <li
        className={`relative flex w-full min-h-[11rem] flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-stretch sm:gap-6 sm:p-5 ${GUAVA_CARD}`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close details"
          className="absolute right-3 top-3 rounded-lg bg-black/25 p-1 text-white/90 transition-colors hover:bg-black/40"
        >
          <X className="size-4" weight="bold" />
        </button>

        <div className="min-w-0 flex-1 space-y-3 pr-8 sm:max-w-[38%]">
          <FitBadge role={role} />
          <h3 className="text-lg font-semibold leading-snug tracking-tight text-white">
            {role.title}
          </h3>
          {band ? (
            <p className="font-mono text-base font-bold leading-tight text-white">
              {band}
            </p>
          ) : (
            <p className="text-sm font-medium text-white/75">
              Salary estimate unavailable
            </p>
          )}
          {role.salary?.label ? (
            <p className="text-xs text-white/70">{role.salary.label}</p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 border-white/20 sm:border-l sm:pl-6">
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-white/95">{role.whyFit}</p>
            {role.evidenceSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {role.evidenceSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-black/20 px-2 py-0.5 text-xs text-white/90"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <Link
            href={jobsSearchHref(role.searchCta)}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-sm font-semibold text-[oklch(0.42_0.12_155)] transition-[filter] hover:brightness-105 sm:w-auto sm:self-start"
          >
            <MagnifyingGlass className="size-4" weight="bold" />
            Search jobs
          </Link>
        </div>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={false}
        className={`flex min-h-[13.5rem] w-[min(100%,9.75rem)] flex-col justify-between gap-3 rounded-2xl p-3.5 text-left transition-[transform,box-shadow] hover:brightness-[1.03] active:scale-[0.99] sm:w-[10.25rem] ${GUAVA_CARD}`}
      >
        <div className="space-y-2">
          <FitBadge role={role} />
          <h3 className="text-sm font-semibold leading-snug tracking-tight text-white">
            {role.title}
          </h3>
          <p className="line-clamp-3 text-xs leading-relaxed text-white/85">
            {role.whyFit}
          </p>
        </div>

        <div className="mt-auto space-y-2 border-t border-white/20 pt-2.5">
          {band ? (
            <p className="font-mono text-sm font-bold leading-tight text-white">
              {band}
            </p>
          ) : (
            <p className="text-xs font-medium text-white/75">
              Estimate unavailable
            </p>
          )}
          <span className="block text-center text-[0.65rem] font-medium uppercase tracking-wide text-white/70">
            Tap for details
          </span>
        </div>
      </button>
    </li>
  );
}

export function MarketFitPanel({
  profileId,
  skillsCount,
  getToken,
}: {
  profileId: string;
  skillsCount: number;
  getToken: () => Promise<string>;
}) {
  const [result, setResult] = useState<MarketFitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTitle, setExpandedTitle] = useState<string | null>(null);

  const loadCached = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await apiFetch<MarketFitResponse>(
        `/profiles/${profileId}/market-fit`,
        { token },
      );
      setResult(data);
      track(AnalyticsEvents.market_fit_viewed, {
        profileId,
        roleCount: data.roles.length,
      });
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 404 || err.code === "MARKET_FIT_NOT_FOUND")
      ) {
        setResult(null);
      } else {
        setError(
          err instanceof Error ? err.message : "Could not load Market Fit",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, profileId]);

  useEffect(() => {
    void loadCached();
  }, [loadCached]);

  async function generate() {
    if (skillsCount === 0) {
      setError("Add skills to your profile first, then generate Market Fit.");
      return;
    }
    setPending(true);
    setError(null);
    setExpandedTitle(null);
    track(AnalyticsEvents.market_fit_generated, { profileId });
    try {
      const token = await getToken();
      const data = await apiFetch<MarketFitResponse>(
        `/profiles/${profileId}/market-fit`,
        { method: "POST", token },
      );
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError(
          "Market Fit API is not available yet. Restart the API (port 3001) and try again.",
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Market Fit generation failed",
        );
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <PaperPanel className="mt-6 space-y-4 border-guava-green/15 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold tracking-tight">
            Market fit
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Five roles that suit your skills — with estimated salary bands in
            your registered region. Tap a card to read the full picture.
          </p>
        </div>
        <button
          type="button"
          disabled={pending || skillsCount === 0}
          onClick={() => void generate()}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60 ${GUAVA_CARD}`}
        >
          {pending ? (
            <CircleNotch className="size-4 animate-spin" weight="bold" />
          ) : result ? (
            <ArrowClockwise className="size-4" weight="bold" />
          ) : (
            <Sparkle className="size-4" weight="fill" />
          )}
          {pending ? "Generating…" : result ? "Refresh" : "Generate"}
        </button>
      </div>

      {skillsCount === 0 ? (
        <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          Add skills in Role details above so we can suggest titles without
          echoing your current job title.
        </p>
      ) : null}

      {result?.stale ? (
        <p
          className="rounded-lg border border-guava-pink/25 bg-guava-pink/5 px-3 py-2 text-sm text-guava-pink"
          role="status"
        >
          Your skills or location changed since this run. Refresh for an
          updated view.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-1" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-52 w-36 shrink-0 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      ) : null}

      {!loading && result ? (
        <ul className="flex flex-row flex-wrap gap-3">
          {result.roles.map((role) => (
            <MarketFitRoleCard
              key={role.title}
              role={role}
              expanded={expandedTitle === role.title}
              onToggle={() =>
                setExpandedTitle((prev) =>
                  prev === role.title ? null : role.title,
                )
              }
            />
          ))}
        </ul>
      ) : null}

      {!loading && !result && skillsCount > 0 && !error ? (
        <p className="text-sm text-muted-foreground">
          Generate to see five skill-based roles and regional salary bands.
        </p>
      ) : null}

      {result?.attribution?.length ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {result.attribution.join(" ")}
        </p>
      ) : null}
    </PaperPanel>
  );
}
