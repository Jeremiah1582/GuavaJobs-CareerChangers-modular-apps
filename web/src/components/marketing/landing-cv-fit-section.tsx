"use client";

import {
  CircleNotch,
  FileArrowUp,
  LockKey,
  Sparkle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { apiFetch } from "@/api/client";
import type { CvUploadResponse, MeResponse } from "@/api/types";
import { LandingFullscreenSection } from "@/components/marketing/landing-fullscreen-section";
import { Reveal } from "@/components/marketing/reveal";
import { SoftOrb } from "@/components/marketing/hero-motion";
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

export function LandingCvFitSection() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    void getAccessTokenOrNull().then((token) => setSignedIn(Boolean(token)));
  }, []);

  const finishWithAuthGate = useCallback(async (file: File) => {
    setPhase("reading");
    setFileName(file.name);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, reduce ? 400 : 2200));

    const token = await getAccessTokenOrNull();
    if (token) {
      try {
        const me = await apiFetch<MeResponse>("/me", { token });
        const profileId = me.defaultProfileId ?? me.defaultProfile?.id ?? null;
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
  }, [reduce, router]);

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
      className="justify-center px-[2.5vw] pb-16 pt-20 md:px-[3vw] md:pb-24"
    >
      <SoftOrb className="left-[-8%] bottom-[10%] z-0 h-96 w-96 bg-guava-green/25" />
      <SoftOrb className="right-[-6%] top-[14%] z-0 h-64 w-64 bg-guava-pink/15" />

      <div className="relative z-10 mx-auto flex w-full max-w-[96rem] flex-1 flex-col justify-center gap-10 md:gap-12">
        <Reveal className="w-full max-w-3xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-guava-green">
            Market fit preview
          </p>
          <h2
            className="mt-4 max-w-[16ch] text-balance text-[clamp(1.85rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-foreground [overflow-wrap:anywhere] [min-width:0]"
            style={{ fontStyle: "normal" }}
          >
            Want to know where your skills are needed?
          </h2>
          <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-muted-foreground md:text-lg">
            Upload your CV. We&apos;ll map roles you fit, salary bands to aim
            for, and gaps to close — honestly, from your real experience.
          </p>
        </Reveal>

        <Reveal className="w-[min(92vw,42rem)]" delay={0.08}>
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
                "group flex min-h-[14rem] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-[border-color,background-color,box-shadow]",
                dragOver
                  ? "border-guava-green bg-white/90 shadow-lg"
                  : "border-guava-green/35 bg-white/70 hover:border-guava-green/55 hover:bg-white/85",
              ].join(" ")}
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-guava-green/20 to-guava-pink/15 text-guava-green">
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
            <div className="flex min-h-[14rem] flex-col items-center justify-center gap-4 rounded-2xl border border-guava-green/25 bg-white/80 px-6 py-12 text-center">
              <CircleNotch
                className="size-10 animate-spin text-guava-green"
                weight="bold"
                aria-hidden
              />
              <p className="text-lg font-semibold text-foreground">
                Reading your CV…
              </p>
              <p className="max-w-[36ch] text-sm text-muted-foreground">
                {fileName
                  ? `Preparing market fit for ${fileName}`
                  : "Preparing your market fit preview"}
              </p>
            </div>
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
                      className="flex items-center justify-between rounded-xl border border-guava-green/15 bg-gradient-to-r from-guava-green/10 to-guava-pink/5 px-4 py-3"
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

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-white/55 via-white/80 to-white/95 px-6 text-center backdrop-blur-[2px]">
                  <span className="flex size-12 items-center justify-center rounded-full bg-guava-pink/10 text-guava-pink">
                    <LockKey className="size-6" weight="duotone" />
                  </span>
                  <div className="max-w-sm space-y-2">
                    <p className="text-lg font-semibold text-foreground">
                      {signedIn
                        ? "Open your profile to see full results"
                        : "Create a free account to unlock your report"}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Role matches, salary bands, and honest fit notes stay
                      private until you sign in. No invented experience — ever.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {signedIn ? (
                      <SpringCta href="/app/profile" variant="green" withArrow>
                        View market fit
                      </SpringCta>
                    ) : (
                      <>
                        <SpringCta
                          href={MARKET_FIT_SIGNUP_PATH}
                          variant="green"
                          withArrow
                        >
                          Sign up free
                        </SpringCta>
                        <Link
                          href={MARKET_FIT_SIGNIN_PATH}
                          className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-guava-green hover:underline"
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
        </Reveal>

        {phase === "idle" ? (
          <Reveal delay={0.12}>
            <p className="max-w-[40ch] text-xs leading-relaxed text-muted-foreground">
              We analyse skills you actually list. Results unlock after you
              create an account — your CV is held only for this session until
              then.
            </p>
          </Reveal>
        ) : null}
      </div>
    </LandingFullscreenSection>
  );
}
