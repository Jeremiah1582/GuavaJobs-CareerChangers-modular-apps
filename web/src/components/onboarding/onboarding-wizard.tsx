"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type {
  CvMeta,
  CvUploadResponse,
  MeResponse,
  ProfileAtsAssessment,
  ProfileDetail,
  ProfileResponse,
} from "@/api/types";
import { OnboardingProgress } from "@/components/onboarding/progress";
import { StepAts } from "@/components/onboarding/step-ats";
import { StepCv } from "@/components/onboarding/step-cv";
import { StepIndustry } from "@/components/onboarding/step-industry";
import { StepName } from "@/components/onboarding/step-name";
import {
  markOnboardingComplete,
  ONBOARDING_STEPS,
  type OnboardingStep,
  type ProfileIndustry,
  type SeniorityLevel,
} from "@/lib/onboarding";
import { getAccessToken } from "@/lib/session";
import { AnalyticsEvents, track } from "@/lib/analytics";

const spring = { type: "spring" as const, stiffness: 120, damping: 20 };

export function OnboardingWizard() {
  const router = useRouter();
  const [bootError, setBootError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<OnboardingStep>("name");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [parseStatus, setParseStatus] = useState<CvMeta["parseStatus"] | null>(
    null,
  );
  const [assessment, setAssessment] = useState<ProfileAtsAssessment | null>(
    null,
  );
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const load = useCallback(async () => {
    let token: string;
    try {
      token = await getAccessToken();
    } catch {
      router.replace("/sign-in?next=/onboarding");
      // Keep loading UI until navigation completes
      return "redirect" as const;
    }

    const meRes = await apiFetch<MeResponse>("/me", { token });
    setMe(meRes);

    if (!meRes.defaultProfileId) {
      throw new Error("No default profile yet — refresh and try again.");
    }

    const detail = await apiFetch<ProfileDetail>(
      `/profiles/${meRes.defaultProfileId}`,
      { token },
    );
    setProfile(detail);
    setParseStatus(detail.currentCv?.parseStatus ?? null);
    if (detail.generalAtsAssessment) {
      setAssessment(detail.generalAtsAssessment);
    }

    // Resume mid-flow if returning
    if (detail.currentCv?.parseStatus === "READY") {
      setStep("ats");
    } else if (detail.currentCv) {
      setStep("cv");
    } else if (
      detail.jobTitle !== "Job Seeker" ||
      detail.primaryIndustry !== "OTHER"
    ) {
      setStep("cv");
    } else if (meRes.name && meRes.name !== meRes.email.split("@")[0]) {
      setStep("industry");
    }
    return "ok" as const;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await load();
        if (result === "redirect") return;
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setBootError(
            err instanceof Error ? err.message : "Failed to start onboarding",
          );
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      stopPoll();
    };
  }, [load, stopPoll]);

  const startPoll = useCallback(
    (profileId: string) => {
      stopPoll();
      pollRef.current = setInterval(async () => {
        try {
          const token = await getAccessToken();
          const detail = await apiFetch<ProfileDetail>(
            `/profiles/${profileId}`,
            { token },
          );
          const status = detail.currentCv?.parseStatus ?? null;
          setParseStatus(status);
          setProfile(detail);
          if (status === "READY") {
            track(AnalyticsEvents.cv_parse_succeeded);
            stopPoll();
          } else if (status === "FAILED") {
            track(AnalyticsEvents.cv_parse_failed);
            stopPoll();
          }
        } catch {
          // keep polling; transient errors happen
        }
      }, 2000);
    },
    [stopPoll],
  );

  async function saveName(name: string) {
    const token = await getAccessToken();
    const updated = await apiFetch<MeResponse>("/me", {
      method: "PATCH",
      token,
      body: JSON.stringify({ name }),
    });
    setMe(updated);
    track(AnalyticsEvents.onboarding_step_completed, { step: "name" });
    setStep("industry");
  }

  async function saveIndustry(data: {
    profileTitle: string;
    jobTitle: string;
    seniority: SeniorityLevel;
    primaryIndustry: ProfileIndustry;
  }) {
    if (!profile) throw new Error("Profile missing");
    const token = await getAccessToken();
    const updated = await apiFetch<ProfileResponse>(`/profiles/${profile.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(data),
    });
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            ...updated,
            currentCv: prev.currentCv,
            generalAtsAssessment: prev.generalAtsAssessment,
          }
        : {
            ...updated,
            currentCv: null,
            generalAtsAssessment: null,
          },
    );
    track(AnalyticsEvents.onboarding_step_completed, {
      step: "industry",
      industry: data.primaryIndustry,
    });
    setStep("cv");
  }

  async function uploadCv(file: File) {
    if (!profile) throw new Error("Profile missing");
    const token = await getAccessToken();
    const form = new FormData();
    form.append("file", file);
    const res = await apiFetch<CvUploadResponse>(
      `/profiles/${profile.id}/cv`,
      {
        method: "POST",
        token,
        body: form,
      },
    );
    setParseStatus(res.cv.parseStatus);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            currentCvId: res.currentCvId,
            currentCv: res.cv,
            generalAtsAssessment: null,
          }
        : prev,
    );
    setAssessment(null);
    track(AnalyticsEvents.cv_uploaded);
    track(AnalyticsEvents.onboarding_step_completed, { step: "cv" });
    if (res.cv.parseStatus === "PENDING") {
      startPoll(profile.id);
    } else if (res.cv.parseStatus === "READY") {
      track(AnalyticsEvents.cv_parse_succeeded);
    } else if (res.cv.parseStatus === "FAILED") {
      track(AnalyticsEvents.cv_parse_failed);
    }
  }

  async function runAts() {
    if (!profile) return;
    setAtsError(null);
    setAtsLoading(true);
    try {
      const token = await getAccessToken();
      const result = await apiFetch<ProfileAtsAssessment>(
        `/profiles/${profile.id}/ats-assessment`,
        { method: "POST", token },
      );
      setAssessment(result);
      track(AnalyticsEvents.profile_ats_viewed, { score: result.score });
      track(AnalyticsEvents.onboarding_step_completed, { step: "ats" });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "ATS check failed";
      setAtsError(message);
    } finally {
      setAtsLoading(false);
    }
  }

  function finish() {
    markOnboardingComplete();
    router.replace("/app/jobs");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-[220px_1fr] md:px-6">
        <div className="hidden space-y-3 md:block">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (bootError || !me || !profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Could not load onboarding
        </h1>
        <p className="mt-2 text-sm text-destructive" role="alert">
          {bootError ?? "Missing profile"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
          <a
            href="/sign-in?next=/onboarding"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            Sign in again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ background: "var(--wash-hero)" }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-[240px_minmax(0,36rem)] md:gap-16 md:px-6 md:py-16">
        <aside className="md:pt-2">
          <p className="text-sm font-medium text-guava-pink">GuavaJobs</p>
          <h1 className="mt-2 text-lg font-semibold tracking-tight">
            Set up your profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Under three minutes. One action per step.
          </p>
          <div className="mt-8 hidden md:block">
            <OnboardingProgress step={step} />
          </div>
          <div className="mt-6 flex gap-1.5 md:hidden" aria-label="Progress">
            {ONBOARDING_STEPS.map((id) => (
              <span
                key={id}
                className={[
                  "h-1 flex-1 rounded-full",
                  ONBOARDING_STEPS.indexOf(id) <=
                  ONBOARDING_STEPS.indexOf(step)
                    ? "bg-guava-pink"
                    : "bg-border",
                ].join(" ")}
              />
            ))}
          </div>
        </aside>

        <section className="min-w-0 pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={spring}
            >
              {step === "name" ? (
                <StepName initialName={me.name} onContinue={saveName} />
              ) : null}
              {step === "industry" ? (
                <StepIndustry
                  initial={{
                    profileTitle: profile.profileTitle,
                    jobTitle: profile.jobTitle,
                    seniority: profile.seniority,
                    primaryIndustry: profile.primaryIndustry,
                  }}
                  onContinue={saveIndustry}
                />
              ) : null}
              {step === "cv" ? (
                <StepCv
                  existingCv={profile.currentCv}
                  parseStatus={parseStatus}
                  onUpload={uploadCv}
                  onContinueWhenReady={() => {
                    track(AnalyticsEvents.onboarding_step_completed, {
                      step: "cv_ready",
                    });
                    setStep("ats");
                  }}
                />
              ) : null}
              {step === "ats" ? (
                <StepAts
                  assessment={assessment}
                  loading={atsLoading}
                  error={atsError}
                  onRun={runAts}
                  onFinish={finish}
                  onSkip={finish}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
