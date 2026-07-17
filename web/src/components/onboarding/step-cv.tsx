"use client";

import { FileArrowUp, FileText, WarningCircle } from "@phosphor-icons/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { CvMeta } from "@/api/types";

const ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 5 * 1024 * 1024;
/** Client escape hatch if status stays PENDING (legacy async / stalled API). */
const STUCK_AFTER_MS = 45_000;

export function StepCv({
  existingCv,
  parseStatus,
  onUpload,
  onContinueWhenReady,
  onSkipForNow,
  onRetryParse,
  retrying,
}: {
  existingCv: CvMeta | null;
  parseStatus: CvMeta["parseStatus"] | null;
  onUpload: (file: File) => Promise<void>;
  onContinueWhenReady: () => void;
  /** Leave onboarding so the user can use the app; CV can be finished on Profile. */
  onSkipForNow: () => void;
  /** Unstick a PENDING CV already on the server. */
  onRetryParse: () => Promise<void>;
  retrying: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingSince = useRef<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(
    existingCv?.fileName ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (parseStatus === "PENDING") {
      if (pendingSince.current == null) {
        pendingSince.current = Date.now();
      }
      const left = Math.max(
        0,
        STUCK_AFTER_MS - (Date.now() - pendingSince.current),
      );
      const t = setTimeout(() => setStuck(true), left || 0);
      return () => clearTimeout(t);
    }
    pendingSince.current = null;
    setStuck(false);
  }, [parseStatus]);

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
    setError(null);
    setStuck(false);
    pendingSince.current = null;
    setPending(true);
    setFileName(file.name);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setFileName(existingCv?.fileName ?? null);
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (parseStatus === "READY") {
      onContinueWhenReady();
      return;
    }
    if (parseStatus === "FAILED") {
      setError("Parsing failed. Re-upload a text-based PDF or DOCX.");
      return;
    }
    if (parseStatus === "PENDING") {
      setError(
        stuck
          ? "Still stuck — retry extraction, choose another file, or continue without CV for now."
          : "Still extracting — wait a moment, or choose another file.",
      );
      return;
    }
    setError("Upload a CV to continue.");
  }

  const busy = pending || retrying;
  const canContinue = parseStatus === "READY" && !busy;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Upload your CV
        </h2>
        <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
          One active CV per profile. We extract text for ATS checks and grounded
          cover letters — we do not rewrite the file.
        </p>
      </div>

      <div
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
        className={[
          "flex flex-col items-start gap-3 rounded-xl border border-dashed px-5 py-8 transition-colors",
          dragOver
            ? "border-guava-pink bg-secondary"
            : "border-border bg-card",
        ].join(" ")}
      >
        <FileArrowUp
          className="size-8 text-guava-pink"
          weight="regular"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium text-foreground">
            Drop PDF or DOCX here
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Max 5 MB. Scanned image-only PDFs are not supported in v1.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending
            ? "Uploading & extracting…"
            : parseStatus === "PENDING"
              ? "Choose another file"
              : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {fileName ? (
        <div className="flex items-start gap-3 border-t border-border pt-4">
          <FileText
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            weight="regular"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fileName}</p>
            <ParseStatusLine status={parseStatus} stuck={stuck} />
          </div>
        </div>
      ) : null}

      {error ? (
        <p
          className="flex items-start gap-2 text-sm text-destructive"
          role="alert"
        >
          <WarningCircle className="mt-0.5 size-4 shrink-0" weight="regular" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !canContinue}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {parseStatus === "PENDING" && !stuck
            ? "Extracting…"
            : parseStatus === "READY"
              ? "Continue"
              : "Upload a CV first"}
        </button>

        {parseStatus === "PENDING" || stuck ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onRetryParse().catch((err) => {
              setError(
                err instanceof Error ? err.message : "Retry failed",
              );
            })}
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {retrying ? "Retrying…" : "Retry extraction"}
          </button>
        ) : null}

        {parseStatus === "FAILED" || stuck ? (
          <button
            type="button"
            disabled={busy}
            onClick={onSkipForNow}
            className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            Continue without CV for now
          </button>
        ) : null}
      </div>

      {(stuck || parseStatus === "FAILED") && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          You can finish setup and browse jobs. Upload a readable CV later on
          Profile before generating an application.
        </p>
      )}
    </form>
  );
}

function ParseStatusLine({
  status,
  stuck,
}: {
  status: CvMeta["parseStatus"] | null;
  stuck: boolean;
}) {
  if (!status) return null;
  if (status === "PENDING") {
    return (
      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className="size-1.5 animate-pulse rounded-full bg-guava-pink"
          aria-hidden
        />
        {stuck
          ? "Taking longer than expected — retry or choose another file"
          : "Extracting text…"}
      </p>
    );
  }
  if (status === "FAILED") {
    return (
      <p className="mt-1 text-xs text-destructive">
        Parse failed — try another PDF or DOCX with selectable text.
      </p>
    );
  }
  return (
    <p className="mt-1 text-xs text-guava-green">Ready for ATS check</p>
  );
}
