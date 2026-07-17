"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/api/client";
import type {
  ApplicationResponse,
  CreateManualApplicationBody,
  MeResponse,
} from "@/api/types";
import { PaperPanel, paperInputClass } from "@/components/ui/paper-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { setHasApplicationsCookie } from "@/lib/applications";
import { getAccessToken } from "@/lib/session";

export function ManualApplicationForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [jobRoleTitle, setJobRoleTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [sourceOfListing, setSourceOfListing] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [pastedJobDescription, setPastedJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["me"] as const,
    queryFn: async () => {
      const token = await getAccessToken();
      return apiFetch<MeResponse>("/me", { token });
    },
    staleTime: 30_000,
  });

  const profileId =
    meQuery.data?.defaultProfileId ?? meQuery.data?.defaultProfile?.id ?? null;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) {
        throw new ApiError("Add a profile before logging an application.", {
          status: 400,
          code: "PROFILE_REQUIRED",
        });
      }
      const token = await getAccessToken();
      const body: CreateManualApplicationBody = {
        profileId,
        companyName: companyName.trim(),
        jobRoleTitle: jobRoleTitle.trim(),
      };
      if (jobLocation.trim()) body.jobLocation = jobLocation.trim();
      if (sourceOfListing.trim())
        body.sourceOfListing = sourceOfListing.trim();
      if (applyUrl.trim()) body.applyUrl = applyUrl.trim();
      if (pastedJobDescription.trim())
        body.pastedJobDescription = pastedJobDescription.trim();

      return apiFetch<ApplicationResponse>("/applications", {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
    },
    onSuccess: (data) => {
      setHasApplicationsCookie(true);
      track(AnalyticsEvents.manual_application_created, {
        applicationId: data.id,
      });
      router.push(`/app/applications/${data.id}`);
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create application. Try again.",
      );
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!companyName.trim() || !jobRoleTitle.trim()) {
      setError("Company and role title are required.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <PaperPanel className="border-guava-pink/15 p-6 md:p-8">
      <form onSubmit={onSubmit}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Log a role without AI. Unlimited on Free — add a cover letter later if
        you paste a job description (≥50 characters).
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm md:col-span-1">
          <span className="font-medium">Company *</span>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={paperInputClass}
            maxLength={200}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Role title *</span>
          <input
            required
            value={jobRoleTitle}
            onChange={(e) => setJobRoleTitle(e.target.value)}
            className={paperInputClass}
            maxLength={200}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Location</span>
          <input
            value={jobLocation}
            onChange={(e) => setJobLocation(e.target.value)}
            className={paperInputClass}
            maxLength={200}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Source</span>
          <input
            value={sourceOfListing}
            onChange={(e) => setSourceOfListing(e.target.value)}
            className={paperInputClass}
            placeholder="LinkedIn, referral…"
            maxLength={200}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm md:col-span-2">
          <span className="font-medium">Apply URL</span>
          <input
            type="url"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            className={paperInputClass}
            placeholder="https://"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm md:col-span-2">
          <span className="font-medium">Pasted job description</span>
          <textarea
            value={pastedJobDescription}
            onChange={(e) => setPastedJobDescription(e.target.value)}
            className={`${paperInputClass} min-h-[8rem] resize-y`}
            placeholder="Optional — needed later for hybrid AI cover letter"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={createMutation.isPending || meQuery.isLoading || !profileId}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {createMutation.isPending ? "Saving…" : "Save to tracker"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/app/applications")}
          className="rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
      </form>
    </PaperPanel>
  );
}
