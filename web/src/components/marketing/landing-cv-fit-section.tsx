"use client";

import {
  FileArrowUp,
  LockKey,
  Sparkle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/api/client";
import type { CvUploadResponse, MeResponse } from "@/api/types";
import { LandingFullscreenSection } from "@/components/marketing/landing-fullscreen-section";
import { Reveal } from "@/components/marketing/reveal";
import { SpringCta } from "@/components/marketing/spring-cta";
import { getAccessTokenOrNull } from "@/lib/session";
import {
  MARKET_FIT_SIGNIN_PATH,
  MARKET_FIT_SIGNUP_PATH,
  storePendingCv,
} from "@/lib/pending-cv";

const ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 5 * 1024 * 1024;

type Phase = "idle" | "reading" | "ready";

const PLACEHOLDER_ROLES = [
  { title: "Role match", band: "—" },
  { title: "Adjacent path", band: "—" },
  { title: "Salary band", band: "—" },
] as const;

function CvReadingSkeleton({ fileName }: { fileName: string | null }) {
  return (
    <div
      className="flex min-h-[14rem] flex-col gap-4 rounded-2xl border border-guava-green/25 bg-white/80 px-6 py-10"
      aria-busy="true"
      aria-label="Preparing your CV"
    >
      <div className="h-3 w-32 animate-pulse rounded-md bg-muted" />
      <div className="space-y-2.5">
        <div className="h-10 animate-pulse rounded-xl bg-muted/80" />
        <div className="h-10 w-[88%] animate-pulse rounded-xl bg-muted/70" />
        <div className="h-10 w-[72%] animate-pulse rounded-xl bg-muted/60" />
      </div>
      <p className="text-sm text-muted-foreground">
        {fileName ? `Saving ${fileName}…` : "Saving your CV…"}
      </p>
    </div>
  );
}

export function LandingCvFitSection() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    void getAccessTokenOrNull().then((token) => setSignedIn(Boolean(token)));
  }, []);

  const finishWithAuthGate = useCallback(
    async (file: File) => {
      setPhase("reading");
      setFileName(file.name);
      setError(null);

      const token = await getAccessTokenOrNull();
      if (token) {
        try {
          const me = await apiFetch<MeResponse>("/me", { token });
          const profileId =
            me.defaultProfileId ?? me.defaultProfile?.id ?? null;
          if (profileId) {
            const form = new FormData();
            form.append("file", file);
            await apiFetch<CvUploadResponse>(`/profiles/${profileId}/cv`, {
              method: "POST",
              token,
              body: form,
            });
            router.push("/app/profile");
            return;
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
          setPhase("idle");
          return;
        }
      }

      try {
        await storePendingCv(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not store CV");
        setPhase("idle");
        return;
      }

      setPhase("ready");
    },
    [router],
  );

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("File must be 5 MB or smaller.");
      return;
    }
    const okType =
      file.type === "application/pdf" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      /\.pdf$/i.test(file.name) ||
      /\.docx$/i.test(file.name);
    if (!okType) {
      setError("Upload a PDF or DOCX file.");
      return;
    }
    await finishWithAuthGate(file);
  }

  return (
    <LandingFullscreenSection
      id="cv-fit"
      wash="mint"
      aria-label="CV market fit"
      className="justify-center px-4 pb-12 pt-16 sm:px-5 sm:pb-16 md:px-6 md:pb-24 md:pt-20"
    >
      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[96rem] flex-1 flex-col justify-center gap-6 sm:gap-8 md:gap-12">
        <Reveal className="w-full min-w-0 max-w-3xl" animate={false}>
          <h2
            className="max-w-[16ch] text-balance text-[clamp(1.85rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-foreground [overflow-wrap:anywhere] [min-width:0]"
            style={{ fontStyle: "normal" }}
          >
            Want to know where your skills are needed?
          </h2>
          <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-muted-foreground md:text-lg">
            Upload your CV. We&apos;ll map roles you fit, salary bands to aim
            for, and gaps to close — honestly, from your real experience.
          </p>
        </Reveal>

        <div className="w-full min-w-0 max-w-2xl">
          {phase === "idle" ? (
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={[
                "group flex min-h-[14rem] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-[border-color,background-color]",
                dragOver
                  ? "border-guava-green bg-white/90"
                  : "border-guava-green/35 bg-white/70 hover:border-guava-green/55 hover:bg-white/85",
              ].join(" ")}
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-guava-green/15 text-guava-green">
                <FileArrowUp className="size-7" weight="duotone" />
              </span>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Drop your CV here
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  PDF or DOCX · up to 5 MB
                </p>
              </div>
              <span className="rounded-full border border-guava-green/30 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors group-hover:border-guava-green/50">
                Choose file
              </span>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
            </div>
          ) : null}

          {phase === "reading" ? (
            <CvReadingSkeleton fileName={fileName} />
          ) : null}

          {phase === "ready" ? (
            <div className="relative overflow-hidden rounded-2xl border border-guava-green/25 bg-white/85 shadow-[0_24px_80px_-32px_color-mix(in_oklab,var(--guava-green)_45%,transparent)]">
              <div className="border-b border-guava-green/15 px-5 py-4 md:px-6">
                <div className="flex items-center gap-2 text-sm font-medium text-guava-green">
                  <Sparkle className="size-4" weight="fill" aria-hidden />
                  Market fit ready
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {fileName ? `Based on ${fileName}` : "Based on your upload"}
                </p>
              </div>

              <div className="relative px-5 py-6 md:px-6">
                <ul className="space-y-3 blur-[6px] select-none" aria-hidden>
                  {PLACEHOLDER_ROLES.map((row) => (
                    <li
                      key={row.title}
                      className="flex items-center justify-between rounded-xl border border-guava-green/15 bg-guava-green/8 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {row.title}
                      </span>
                      <span className="font-mono text-sm text-muted-foreground">
                        {row.band}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/85 px-4 py-6 text-center sm:gap-5 sm:px-6">
                  <span className="flex size-12 items-center justify-center rounded-full bg-guava-pink/10 text-guava-pink">
                    <LockKey className="size-6" weight="duotone" />
                  </span>
                  <div className="max-w-sm min-w-0 space-y-2">
                    <p className="text-base font-semibold text-foreground sm:text-lg">
                      {signedIn
                        ? "Open your profile to see full results"
                        : "Create a free account to unlock your report"}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Role matches, salary bands, and honest fit notes stay
                      private until you sign in. No invented experience — ever.
                    </p>
                  </div>
                  <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:w-auto sm:flex-row sm:items-center sm:justify-center">
                    {signedIn ? (
                      <SpringCta
                        href="/app/profile"
                        variant="green"
                        withArrow
                        className="w-full sm:w-auto"
                      >
                        View market fit
                      </SpringCta>
                    ) : (
                      <>
                        <SpringCta
                          href={MARKET_FIT_SIGNUP_PATH}
                          variant="green"
                          withArrow
                          className="w-full sm:w-auto"
                        >
                          Sign up free
                        </SpringCta>
                        <Link
                          href={MARKET_FIT_SIGNIN_PATH}
                          className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-guava-green hover:underline"
                        >
                          Sign in
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        {phase === "idle" ? (
          <p className="max-w-[40ch] text-xs leading-relaxed text-muted-foreground">
            We analyse skills you actually list. Results unlock after you
            create an account — your CV is held only for this session until
            then.
          </p>
        ) : null}
      </div>
    </LandingFullscreenSection>
  );
}
