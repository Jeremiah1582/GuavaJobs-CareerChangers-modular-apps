"use client";

import { FileArrowUp, FileText, WarningCircle } from "@phosphor-icons/react";
import { FormEvent, useRef, useState } from "react";
import type { CvMeta } from "@/api/types";

const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 5 * 1024 * 1024;

export function StepCv({
  existingCv,
  parseStatus,
  onUpload,
  onContinueWhenReady,
}: {
  existingCv: CvMeta | null;
  parseStatus: CvMeta["parseStatus"] | null;
  onUpload: (file: File) => Promise<void>;
  onContinueWhenReady: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(
    existingCv?.fileName ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
      setError("Still parsing — wait a moment, then continue.");
      return;
    }
    setError("Upload a CV to continue.");
  }

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
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
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
            <ParseStatusLine status={parseStatus} />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
          <WarningCircle className="mt-0.5 size-4 shrink-0" weight="regular" />
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || parseStatus === "PENDING" || !parseStatus}
        className="self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {parseStatus === "PENDING"
          ? "Parsing…"
          : parseStatus === "READY"
            ? "Continue"
            : "Upload a CV first"}
      </button>
    </form>
  );
}

function ParseStatusLine({
  status,
}: {
  status: CvMeta["parseStatus"] | null;
}) {
  if (!status) return null;
  if (status === "PENDING") {
    return (
      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className="size-1.5 animate-pulse rounded-full bg-guava-pink"
          aria-hidden
        />
        Extracting text…
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
