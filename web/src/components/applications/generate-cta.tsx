"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleNotch, Sparkle } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type { ApplicationResponse, MeResponse } from "@/api/types";
import { QuotaChip } from "@/components/app/quota-chip";
import { QuotaSheet } from "@/components/applications/quota-sheet";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { setHasApplicationsCookie } from "@/lib/applications";
import { getAccessToken } from "@/lib/session";

export function GenerateCta({
  canonicalJobKey,
}: {
  canonicalJobKey: string;
}) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAction, setNextAction] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["me"] as const,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<MeResponse>("/me", { token });
    },
    staleTime: 30_000,
  });

  const used = meQuery.data?.usage.aiGenerationsUsedPeriod ?? 0;
  const limit = meQuery.data?.usage.aiGenerationsLimit ?? null;
  const atLimit =
    limit != null && used >= limit;
  const profileId =
    meQuery.data?.defaultProfileId ?? meQuery.data?.defaultProfile?.id ?? null;

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) {
        throw new ApiError("Add a profile before generating.", {
          status: 400,
          code: "PROFILE_REQUIRED",
        });
      }
      const token = await getAccessToken();
      if (!idempotencyKey.current) {
        idempotencyKey.current =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `web-gen-${Date.now()}`;
      }
      return apiFetch<ApplicationResponse>("/applications/generate", {
        method: "POST",
        token,
        headers: {
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          profileId,
          canonicalJobKey,
        }),
      });
    },
    onSuccess: (data) => {
      setError(null);
      setNextAction(null);
      setHasApplicationsCookie(true);
      if (
        data.generationStatus === "PENDING" ||
        data.generationStatus === "PROCESSING"
      ) {
        track(AnalyticsEvents.generate_started, {
          applicationId: data.id,
          canonicalJobKey,
        });
      }
      router.push(`/app/applications/${data.id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
        track(AnalyticsEvents.quota_hit, {
          source: "generate",
          canonicalJobKey,
        });
        setQuotaOpen(true);
        setError(null);
        setNextAction(null);
        return;
      }
      if (err instanceof ApiError && err.code === "CV_REQUIRED") {
        setError(err.message);
        setNextAction("Upload and wait for CV parse on Profile, then retry.");
        return;
      }
      if (err instanceof ApiError && err.code === "PROFILE_REQUIRED") {
        setError(err.message);
        setNextAction("Finish onboarding or set a default profile.");
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not start generation. Try again.",
      );
      setNextAction("Check your connection, then try Generate again.");
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={
            generateMutation.isPending ||
            meQuery.isLoading ||
            atLimit ||
            !profileId
          }
          onClick={() => {
            if (atLimit) {
              track(AnalyticsEvents.quota_hit, {
                source: "generate_disabled",
                canonicalJobKey,
              });
              setQuotaOpen(true);
              return;
            }
            generateMutation.mutate();
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
        >
          {generateMutation.isPending ? (
            <CircleNotch className="size-4 animate-spin" weight="bold" />
          ) : (
            <Sparkle className="size-4" weight="duotone" />
          )}
          {generateMutation.isPending
            ? "Starting…"
            : "Generate application"}
        </button>
        {meQuery.data ? (
          <QuotaChip used={used} limit={limit} />
        ) : meQuery.isLoading ? (
          <div
            className="h-9 w-28 animate-pulse rounded-lg bg-muted"
            aria-hidden
          />
        ) : null}
      </div>

      {atLimit ? (
        <p className="text-xs text-muted-foreground">
          Free AI limit reached this period.{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => setQuotaOpen(true)}
          >
            See options
          </button>
        </p>
      ) : null}

      {error ? (
        <div role="alert">
          <p className="text-sm text-destructive">{error}</p>
          {nextAction ? (
            <p className="mt-1 text-xs text-muted-foreground">{nextAction}</p>
          ) : null}
          {error.toLowerCase().includes("cv") ||
          nextAction?.toLowerCase().includes("cv") ? (
            <a
              href="/app/profile"
              className="mt-2 inline-block text-xs font-medium text-guava-green underline-offset-2 hover:underline"
            >
              Open profile
            </a>
          ) : null}
        </div>
      ) : null}

      <QuotaSheet open={quotaOpen} onClose={() => setQuotaOpen(false)} />
    </div>
  );
}
