"use client";

import { FormEvent, useState } from "react";
import {
  INDUSTRY_LABELS,
  PROFILE_INDUSTRIES,
  SENIORITY_LABELS,
  SENIORITY_LEVELS,
  type ProfileIndustry,
  type SeniorityLevel,
} from "@/lib/onboarding";

export function StepIndustry({
  initial,
  onContinue,
}: {
  initial: {
    profileTitle: string;
    jobTitle: string;
    seniority: SeniorityLevel;
    primaryIndustry: ProfileIndustry;
  };
  onContinue: (data: {
    profileTitle: string;
    jobTitle: string;
    seniority: SeniorityLevel;
    primaryIndustry: ProfileIndustry;
  }) => Promise<void>;
}) {
  const [jobTitle, setJobTitle] = useState(
    initial.jobTitle === "Job Seeker" ? "" : initial.jobTitle,
  );
  const [profileTitle, setProfileTitle] = useState(
    initial.profileTitle === "Default" ? "" : initial.profileTitle,
  );
  const [seniority, setSeniority] = useState<SeniorityLevel>(
    initial.seniority === "JUNIOR" && initial.jobTitle === "Job Seeker"
      ? "MID"
      : initial.seniority,
  );
  const [industry, setIndustry] = useState<ProfileIndustry | null>(
    initial.primaryIndustry === "OTHER" && initial.jobTitle === "Job Seeker"
      ? null
      : initial.primaryIndustry,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!industry) {
      setError("Pick the industry you are targeting.");
      return;
    }
    const title = jobTitle.trim();
    if (!title) {
      setError("Enter a target job title.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onContinue({
        jobTitle: title,
        profileTitle: profileTitle.trim() || title,
        seniority,
        primaryIndustry: industry,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save role");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          What are you aiming for?
        </h2>
        <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
          Industry drives your free CV health check. Job title and seniority
          shape search and scoring later.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          Primary industry
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROFILE_INDUSTRIES.filter((id) => id !== "OTHER").map((id) => {
            const selected = industry === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setIndustry(id)}
                className={[
                  "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors active:scale-[0.98]",
                  selected
                    ? "border-guava-pink bg-secondary font-medium text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                ].join(" ")}
              >
                {INDUSTRY_LABELS[id]}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setIndustry("OTHER")}
          className={[
            "mt-1 self-start text-xs underline-offset-2 hover:underline",
            industry === "OTHER"
              ? "font-medium text-guava-pink"
              : "text-muted-foreground",
          ].join(" ")}
        >
          My field is not listed
        </button>
      </fieldset>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">Target job title</span>
        <input
          type="text"
          required
          maxLength={200}
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="rounded-lg border border-input bg-card px-3 py-2.5 text-foreground outline-none ring-ring focus:ring-2"
          placeholder="e.g. Product Manager"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">
          Profile label{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <input
          type="text"
          maxLength={200}
          value={profileTitle}
          onChange={(e) => setProfileTitle(e.target.value)}
          className="rounded-lg border border-input bg-card px-3 py-2.5 text-foreground outline-none ring-ring focus:ring-2"
          placeholder="e.g. Finance → Product"
        />
        <span className="text-xs text-muted-foreground">
          Useful if you later add a second career angle.
        </span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          Seniority
        </legend>
        <div className="flex flex-wrap gap-2">
          {SENIORITY_LEVELS.map((level) => {
            const selected = seniority === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setSeniority(level)}
                className={[
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors active:scale-[0.98]",
                  selected
                    ? "border-guava-pink bg-secondary font-medium text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {SENIORITY_LABELS[level]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
