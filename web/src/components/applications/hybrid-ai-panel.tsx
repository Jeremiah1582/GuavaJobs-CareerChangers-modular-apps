"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleNotch, Sparkle } from "@phosphor-icons/react";
import { apiFetch, ApiError } from "@/api/client";
import type { ApplicationResponse } from "@/api/types";
import { QuotaSheet } from "@/components/applications/quota-sheet";
import { PaperPanel, paperInputClass } from "@/components/ui/paper-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { getAccessToken } from "@/lib/session";

export function HybridAiPanel({ app }: { app: ApplicationResponse }) {
  const queryClient = useQueryClient();
  const [jd, setJd] = useState(app.pastedJobDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const [quotaOpen, setQuotaOpen] = useState(false);

  const existingJd = (app.pastedJobDescription ?? "").trim();
  const effectiveJd = jd.trim() || existingJd;
  const jdOk = effectiveJd.length >= 50;

  const letterMutation = useMutation({
    mutationFn: async () => {
      if (!jdOk) {
        throw new ApiError(
          "Paste a job description of at least 50 characters.",
          { status: 400, code: "JD_TOO_SHORT" },
        );
      }
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(
        `/applications/${app.id}/generate-cover-letter`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            pastedJobDescription: jd.trim() || undefined,
          }),
        },
      );
    },
    onSuccess: (data) => {
      setError(null);
      queryClient.setQueryData(["application", app.id], data);
      track(AnalyticsEvents.generate_started, {
        applicationId: data.id,
        mode: "hybrid_cover_letter",
      });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
        track(AnalyticsEvents.quota_hit, { source: "hybrid_cover_letter" });
        setQuotaOpen(true);
        return;
      }
      setError(
        err instanceof ApiError ? err.message : "Could not start cover letter.",
      );
    },
  });

  const atsMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(
        `/applications/${app.id}/generate-ats-report`,
        { method: "POST", token },
      );
    },
    onSuccess: (data) => {
      setError(null);
      queryClient.setQueryData(["application", app.id], data);
      track(AnalyticsEvents.generate_started, {
        applicationId: data.id,
        mode: "hybrid_ats",
      });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
        track(AnalyticsEvents.quota_hit, { source: "hybrid_ats" });
        setQuotaOpen(true);
        return;
      }
      setError(
        err instanceof ApiError ? err.message : "Could not start ATS report.",
      );
    },
  });

  const cvMutation = useMutation({
    mutationFn: async () => {
      if (!jdOk) {
        throw new ApiError(
          "Paste a job description of at least 50 characters.",
          { status: 400, code: "JD_TOO_SHORT" },
        );
      }
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(
        `/applications/${app.id}/generate-cv`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            pastedJobDescription: jd.trim() || undefined,
          }),
        },
      );
    },
    onSuccess: (data) => {
      setError(null);
      queryClient.setQueryData(["application", app.id], data);
      track(AnalyticsEvents.generate_started, {
        applicationId: data.id,
        mode: "hybrid_generate_cv",
      });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
        track(AnalyticsEvents.quota_hit, { source: "hybrid_generate_cv" });
        setQuotaOpen(true);
        return;
      }
      setError(
        err instanceof ApiError ? err.message : "Could not start CV generation.",
      );
    },
  });

  const busy =
    letterMutation.isPending || atsMutation.isPending || cvMutation.isPending;

  return (
    <>
      <PaperPanel className="border-guava-pink/15 p-5 md:p-6">
        <h2 className="text-base font-semibold tracking-tight">
          Optional AI (counts toward quota)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a cover letter, tailored CV, or fit report from a pasted job description.
          Manual tracking stays free either way.
        </p>

        <label className="mt-4 flex flex-col gap-2 text-sm">
          <span className="font-medium">Job description</span>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            className={`${paperInputClass} min-h-[8rem] resize-y`}
            placeholder="Paste the JD (min 50 characters for cover letter)"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {effectiveJd.length} chars
            {!jdOk ? " · need ≥50 for cover letter" : ""}
          </span>
        </label>

        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !jdOk}
            onClick={() => letterMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {letterMutation.isPending ? (
              <CircleNotch className="size-4 animate-spin" weight="bold" />
            ) : (
              <Sparkle className="size-4" weight="duotone" />
            )}
            Generate cover letter
          </button>
          <button
            type="button"
            disabled={busy || !app.coverLetterContent}
            onClick={() => atsMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            title={
              !app.coverLetterContent
                ? "Generate a cover letter first"
                : undefined
            }
          >
            {atsMutation.isPending ? (
              <CircleNotch className="size-4 animate-spin" weight="bold" />
            ) : null}
            Generate fit report
          </button>
          <button
            type="button"
            disabled={busy || !jdOk}
            onClick={() => cvMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {cvMutation.isPending ? (
              <CircleNotch className="size-4 animate-spin" weight="bold" />
            ) : null}
            Generate tailored CV
          </button>
        </div>
      </PaperPanel>
      <QuotaSheet open={quotaOpen} onClose={() => setQuotaOpen(false)} />
    </>
  );
}
