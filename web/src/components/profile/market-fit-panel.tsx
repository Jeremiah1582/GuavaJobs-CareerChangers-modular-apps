"use client";

import {
  ArrowClockwise,
  CircleNotch,
  MagnifyingGlass,
  Sparkle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type { MarketFitResponse } from "@/api/types";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { formatSalary } from "@/lib/jobs";
import { PaperPanel } from "@/components/ui/paper-panel";

function fitLabel(level: MarketFitResponse["roles"][number]["fitLevel"]): string {
  if (level === "strong") return "Strong match";
  if (level === "adjacent") return "Adjacent";
  return "Stretch";
}

function fitTone(level: MarketFitResponse["roles"][number]["fitLevel"]): string {
  if (level === "strong")
    return "border-guava-green/30 bg-guava-green/10 text-guava-green";
  if (level === "adjacent")
    return "border-border bg-secondary text-foreground";
  return "border-guava-pink/25 bg-guava-pink/5 text-guava-pink";
}

function jobsSearchHref(cta: MarketFitResponse["roles"][number]["searchCta"]): string {
  const params = new URLSearchParams();
  params.set("q", cta.q);
  params.set("country", cta.country);
  if (cta.location?.trim()) params.set("where", cta.location.trim());
  return `/app/jobs?${params.toString()}`;
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
      if (err instanceof ApiError && err.status === 404) {
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
    track(AnalyticsEvents.market_fit_generated, { profileId });
    try {
      const token = await getToken();
      const data = await apiFetch<MarketFitResponse>(
        `/profiles/${profileId}/market-fit`,
        { method: "POST", token },
      );
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Market Fit generation failed",
      );
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
            your registered region. Free for now; a paywall may apply later.
          </p>
        </div>
        <button
          type="button"
          disabled={pending || skillsCount === 0}
          onClick={() => void generate()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.13_150)] via-[oklch(0.58_0.16_150)] to-[oklch(0.48_0.13_155)] px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60"
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
        <div className="h-28 animate-pulse rounded-lg bg-muted" aria-hidden />
      ) : null}

      {!loading && result ? (
        <ul className="divide-y divide-border/80">
          {result.roles.map((role) => {
            const band = role.salary
              ? formatSalary(
                  role.salary.min,
                  role.salary.max,
                  role.salary.currency,
                )
              : null;
            return (
              <li key={role.title} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">
                    {role.title}
                  </h3>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${fitTone(role.fitLevel)}`}
                  >
                    {fitLabel(role.fitLevel)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {role.whyFit}
                </p>
                {role.evidenceSkills.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Evidence: {role.evidenceSkills.join(", ")}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    {band ? (
                      <>
                        <p className="font-mono text-sm font-medium">{band}</p>
                        <p className="text-xs text-muted-foreground">
                          {role.salary?.label ?? "Estimated annual gross"}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Estimate unavailable for this title/region
                      </p>
                    )}
                  </div>
                  <Link
                    href={jobsSearchHref(role.searchCta)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-guava-green/25 bg-white/80 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-guava-green/45"
                  >
                    <MagnifyingGlass className="size-3.5" weight="bold" />
                    Search jobs
                  </Link>
                </div>
              </li>
            );
          })}
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
