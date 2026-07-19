"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleNotch, GearSix } from "@phosphor-icons/react";
import { apiFetch, ApiError } from "@/api/client";
import type { MeResponse, PatchMeBody } from "@/api/types";
import { AppPageShell } from "@/components/app/app-page-shell";
import { PaperPanel } from "@/components/ui/paper-panel";
import { ErrorState } from "@/components/ui/state-panel";
import { getAccessToken } from "@/lib/session";

function Toggle({
  checked,
  disabled,
  onChange,
  id,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] disabled:opacity-50",
        checked ? "bg-guava-green" : "bg-muted",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

export function SettingsForm() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"] as const,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<MeResponse>("/me", { token });
    },
    retry: 1,
  });

  const prefsMutation = useMutation({
    mutationFn: async (autoGenerateTailoredCv: boolean) => {
      const token = await getAccessToken();
      const body: PatchMeBody = {
        preferences: { autoGenerateTailoredCv },
      };
      return apiFetch<MeResponse>("/me", {
        method: "PATCH",
        token,
        body: JSON.stringify(body),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
    },
  });

  const autoCv =
    meQuery.data?.preferences?.autoGenerateTailoredCv === true;

  return (
    <AppPageShell
      title="Settings"
      description="Control how GuavaJobs builds application packages for you."
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <GearSix className="size-3.5" weight="duotone" />
          Account
        </span>
      }
    >
      {meQuery.isLoading ? (
        <div
          className="h-40 animate-pulse rounded-2xl border border-guava-green/10 bg-white/50"
          aria-hidden
        />
      ) : meQuery.isError ? (
        <ErrorState
          title="Could not load settings"
          message={
            meQuery.error instanceof ApiError
              ? meQuery.error.message
              : "Sign in again, then retry."
          }
          nextAction="Return to Profile or refresh the page."
        />
      ) : (
        <PaperPanel className="border-guava-green/20 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="auto-tailored-cv"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                Auto-generate tailored CV
              </label>
              <p className="mt-1.5 max-w-[55ch] text-sm leading-relaxed text-muted-foreground">
                When off (default), package generate builds a cover letter and
                fit report only. Turn on to also create a job-tailored CV with
                each full generate or regenerate. You can still generate a CV
                on demand from the application desk.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 pt-0.5">
              {prefsMutation.isPending ? (
                <CircleNotch
                  className="size-4 animate-spin text-muted-foreground"
                  weight="bold"
                />
              ) : null}
              <Toggle
                id="auto-tailored-cv"
                checked={autoCv}
                disabled={prefsMutation.isPending}
                onChange={(next) => prefsMutation.mutate(next)}
              />
            </div>
          </div>

          {prefsMutation.isError ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {prefsMutation.error instanceof ApiError
                ? prefsMutation.error.message
                : "Could not save preference. Try again."}
            </p>
          ) : null}

          {prefsMutation.isSuccess ? (
            <p className="mt-4 text-sm text-guava-green" role="status">
              Preference saved.
            </p>
          ) : null}
        </PaperPanel>
      )}
    </AppPageShell>
  );
}
