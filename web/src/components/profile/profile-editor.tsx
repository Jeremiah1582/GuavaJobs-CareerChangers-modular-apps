"use client";

import {
  FileArrowUp,
  FileText,
  WarningCircle,
} from "@phosphor-icons/react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type {
  CvMeta,
  CvUploadResponse,
  MeResponse,
  ProfileDetail,
  ProfileResponse,
} from "@/api/types";
import { AnalyticsEvents, track } from "@/lib/analytics";
import {
  INDUSTRY_LABELS,
  PROFILE_INDUSTRIES,
  SENIORITY_LABELS,
  SENIORITY_LEVELS,
  type ProfileIndustry,
  type SeniorityLevel,
} from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";

const ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 5 * 1024 * 1024;

function QuotaChip({
  used,
  limit,
}: {
  used: number;
  limit: number | null;
}) {
  const unlimited = limit == null;
  const remaining = unlimited ? null : Math.max(0, limit - used);
  const tight = !unlimited && remaining !== null && remaining <= 1;

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm",
        tight
          ? "border-guava-pink/40 bg-guava-pink/10 text-foreground"
          : "border-guava-green/35 bg-guava-green/10 text-foreground",
      ].join(" ")}
    >
      <span className="text-xs font-sans text-muted-foreground">AI gens</span>
      <span className={tight ? "text-guava-pink" : "text-guava-green"}>
        {used}
        {unlimited ? " / unlimited" : ` / ${limit}`}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-8 space-y-4" aria-hidden>
      <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export function ProfileEditor() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [seniority, setSeniority] = useState<SeniorityLevel>("MID");
  const [industry, setIndustry] = useState<ProfileIndustry>("SOFTWARE");
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("");

  const [accountPending, setAccountPending] = useState(false);
  const [accountMsg, setAccountMsg] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [rolePending, setRolePending] = useState(false);
  const [roleMsg, setRoleMsg] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [cvPending, setCvPending] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<CvMeta["parseStatus"] | null>(
    null,
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getToken = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Session expired. Sign in again.");
    }
    return session.access_token;
  }, []);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPoll = useCallback(
    (profileId: string) => {
      stopPoll();
      pollRef.current = setInterval(async () => {
        try {
          const token = await getToken();
          const detail = await apiFetch<ProfileDetail>(
            `/profiles/${profileId}`,
            { token },
          );
          setProfile(detail);
          const status = detail.currentCv?.parseStatus ?? null;
          setParseStatus(status);
          if (status === "READY") {
            track(AnalyticsEvents.cv_parse_succeeded);
            stopPoll();
          } else if (status === "FAILED") {
            track(AnalyticsEvents.cv_parse_failed);
            stopPoll();
          }
        } catch {
          stopPoll();
        }
      }, 2500);
    },
    [getToken, stopPoll],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const meRes = await apiFetch<MeResponse>("/me", { token });
        if (cancelled) return;
        setMe(meRes);
        setName(meRes.name);

        if (!meRes.defaultProfileId) {
          setLoadError(
            "No default profile yet. Finish onboarding, then return here.",
          );
          setLoading(false);
          return;
        }

        const detail = await apiFetch<ProfileDetail>(
          `/profiles/${meRes.defaultProfileId}`,
          { token },
        );
        if (cancelled) return;
        setProfile(detail);
        setProfileTitle(detail.profileTitle);
        setJobTitle(detail.jobTitle);
        setSeniority(detail.seniority);
        setIndustry(detail.primaryIndustry);
        setLocationCity(detail.locationCity ?? "");
        setLocationCountry(detail.locationCountry ?? "");
        setParseStatus(detail.currentCv?.parseStatus ?? null);
        if (detail.currentCv?.parseStatus === "PENDING") {
          startPoll(detail.id);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setLoadError("Session expired. Sign in again.");
        } else {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load profile",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      stopPoll();
    };
  }, [getToken, startPoll, stopPoll]);

  async function saveAccount(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setAccountError("Enter a display name.");
      return;
    }
    setAccountError(null);
    setAccountMsg(null);
    setAccountPending(true);
    try {
      const token = await getToken();
      const updated = await apiFetch<MeResponse>("/me", {
        method: "PATCH",
        token,
        body: JSON.stringify({ name: trimmed }),
      });
      setMe(updated);
      setName(updated.name);
      setAccountMsg("Account saved.");
    } catch (err) {
      setAccountError(
        err instanceof Error ? err.message : "Could not save account",
      );
    } finally {
      setAccountPending(false);
    }
  }

  async function saveRole(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const title = jobTitle.trim();
    if (!title) {
      setRoleError("Enter a target job title.");
      return;
    }
    setRoleError(null);
    setRoleMsg(null);
    setRolePending(true);
    try {
      const token = await getToken();
      const body: Record<string, string> = {
        jobTitle: title,
        profileTitle: profileTitle.trim() || title,
        seniority,
        primaryIndustry: industry,
      };
      if (locationCity.trim()) body.locationCity = locationCity.trim();
      if (locationCountry.trim().length === 2) {
        body.locationCountry = locationCountry.trim().toUpperCase();
      }
      const updated = await apiFetch<ProfileResponse>(
        `/profiles/${profile.id}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify(body),
        },
      );
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...updated,
              currentCv: prev.currentCv,
              generalAtsAssessment: prev.generalAtsAssessment,
            }
          : prev,
      );
      setRoleMsg("Role details saved.");
    } catch (err) {
      setRoleError(
        err instanceof Error ? err.message : "Could not save role details",
      );
    } finally {
      setRolePending(false);
    }
  }

  async function uploadCv(file: File) {
    if (!profile) return;
    if (file.size > MAX_BYTES) {
      setCvError("File must be 5 MB or smaller.");
      return;
    }
    const okType =
      file.type === "application/pdf" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      /\.pdf$/i.test(file.name) ||
      /\.docx$/i.test(file.name);
    if (!okType) {
      setCvError("Upload a PDF or DOCX file.");
      return;
    }
    setCvError(null);
    setCvPending(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch<CvUploadResponse>(
        `/profiles/${profile.id}/cv`,
        { method: "POST", token, body: form },
      );
      setParseStatus(res.cv.parseStatus);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              currentCvId: res.currentCvId,
              currentCv: res.cv,
            }
          : prev,
      );
      track(AnalyticsEvents.cv_uploaded);
      if (res.cv.parseStatus === "PENDING") {
        startPoll(profile.id);
      } else if (res.cv.parseStatus === "READY") {
        track(AnalyticsEvents.cv_parse_succeeded);
      } else if (res.cv.parseStatus === "FAILED") {
        track(AnalyticsEvents.cv_parse_failed);
      }
    } catch (err) {
      setCvError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCvPending(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <Skeleton />
      </main>
    );
  }

  if (loadError && !me) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-6 text-sm text-destructive" role="alert">
          {loadError}. Check that the API is reachable and CORS is deployed.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit your account, target role, and active CV.
          </p>
        </div>
        {me ? (
          <QuotaChip
            used={me.usage.aiGenerationsUsedPeriod}
            limit={me.usage.aiGenerationsLimit}
          />
        ) : null}
      </div>

      {loadError ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      {/* Account */}
      <form
        onSubmit={saveAccount}
        className="mt-10 space-y-4 rounded-lg border border-border bg-card p-5"
      >
        <h2 className="text-base font-semibold tracking-tight">Account</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            Display name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-guava-pink focus:ring-2"
          />
          <p className="text-xs text-muted-foreground">
            Shown on your account. Not a job title.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <span className="font-mono text-sm text-muted-foreground">
            {me?.email}
          </span>
        </div>
        {accountError ? (
          <p className="text-sm text-destructive" role="alert">
            {accountError}
          </p>
        ) : null}
        {accountMsg ? (
          <p className="text-sm text-guava-green" role="status">
            {accountMsg}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={accountPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {accountPending ? "Saving…" : "Save account"}
        </button>
      </form>

      {/* Role */}
      {profile ? (
        <form
          onSubmit={saveRole}
          className="mt-6 space-y-4 rounded-lg border border-border bg-card p-5"
        >
          <h2 className="text-base font-semibold tracking-tight">
            Target role
          </h2>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Primary industry</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROFILE_INDUSTRIES.filter((id) => id !== "OTHER").map((id) => {
                const selected = industry === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setIndustry(id)}
                    className={[
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-guava-pink bg-guava-pink/10 font-medium text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-guava-pink/40",
                    ].join(" ")}
                  >
                    {INDUSTRY_LABELS[id]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="jobTitle" className="text-sm font-medium">
              Job title
            </label>
            <input
              id="jobTitle"
              name="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-guava-pink focus:ring-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="profileTitle" className="text-sm font-medium">
              Profile label{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              id="profileTitle"
              name="profileTitle"
              value={profileTitle}
              onChange={(e) => setProfileTitle(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-guava-pink focus:ring-2"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Seniority</legend>
            <div className="flex flex-wrap gap-2">
              {SENIORITY_LEVELS.map((level) => {
                const selected = seniority === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeniority(level)}
                    className={[
                      "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      selected
                        ? "border-guava-green bg-guava-green/10 font-medium"
                        : "border-border bg-background text-muted-foreground hover:border-guava-green/40",
                    ].join(" ")}
                  >
                    {SENIORITY_LABELS[level]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="locationCity" className="text-sm font-medium">
                City{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                id="locationCity"
                name="locationCity"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-guava-pink focus:ring-2"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="locationCountry" className="text-sm font-medium">
                Country{" "}
                <span className="font-normal text-muted-foreground">
                  (ISO, e.g. GB)
                </span>
              </label>
              <input
                id="locationCountry"
                name="locationCountry"
                maxLength={2}
                value={locationCountry}
                onChange={(e) => setLocationCountry(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm uppercase outline-none ring-guava-pink focus:ring-2"
              />
            </div>
          </div>

          {roleError ? (
            <p className="text-sm text-destructive" role="alert">
              {roleError}
            </p>
          ) : null}
          {roleMsg ? (
            <p className="text-sm text-guava-green" role="status">
              {roleMsg}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={rolePending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {rolePending ? "Saving…" : "Save role"}
          </button>
        </form>
      ) : null}

      {/* CV */}
      {profile ? (
        <section className="mt-6 space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold tracking-tight">Active CV</h2>
          <p className="text-sm text-muted-foreground">
            One active CV per profile. Replace it anytime with a PDF or DOCX
            (max 5 MB).
          </p>

          {profile.currentCv ? (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3">
              <FileText
                className="mt-0.5 size-5 shrink-0 text-guava-pink"
                weight="regular"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {profile.currentCv.fileName}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  parseStatus: {parseStatus ?? profile.currentCv.parseStatus}
                </p>
              </div>
              {parseStatus === "FAILED" ? (
                <WarningCircle
                  className="size-5 shrink-0 text-destructive"
                  weight="regular"
                />
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No CV yet. Upload one to unlock grounded letters and ATS checks.
            </p>
          )}

          {parseStatus === "PENDING" ? (
            <p className="text-sm text-muted-foreground" role="status">
              Parsing your CV… this usually takes a few seconds.
            </p>
          ) : null}
          {parseStatus === "FAILED" ? (
            <p className="text-sm text-destructive" role="alert">
              Parse failed. Try another PDF or DOCX with selectable text.
            </p>
          ) : null}

          <div>
            <input
              ref={inputRef}
              type="file"
              name="cv"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadCv(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={cvPending}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-guava-pink/40 disabled:opacity-60"
            >
              <FileArrowUp className="size-4 text-guava-pink" weight="regular" />
              {cvPending
                ? "Uploading…"
                : profile.currentCv
                  ? "Replace CV"
                  : "Upload CV"}
            </button>
          </div>

          {cvError ? (
            <p className="text-sm text-destructive" role="alert">
              {cvError}
            </p>
          ) : null}

          {profile.generalAtsAssessment ? (
            <div className="rounded-lg border border-guava-green/25 bg-guava-green/5 px-3 py-3">
              <p className="text-sm font-medium text-foreground">
                Last CV health score:{" "}
                <span className="font-mono text-guava-green">
                  {profile.generalAtsAssessment.score}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Industry:{" "}
                {INDUSTRY_LABELS[profile.generalAtsAssessment.industry]}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
