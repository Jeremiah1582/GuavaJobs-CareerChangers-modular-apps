"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowSquareOut,
  CheckCircle,
  FilePdf,
  CircleNotch,
} from "@phosphor-icons/react";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiFetch, apiFetchBlob, ApiError } from "@/api/client";
import type { ApplicationResponse } from "@/api/types";
import { PaperPanel } from "@/components/ui/paper-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { applicationCompany, applicationTitle } from "@/lib/applications";
import { getAccessToken } from "@/lib/session";

function ApplyConfirmSheet({
  open,
  title,
  company,
  busy,
  onYes,
  onNotYet,
  onLater,
}: {
  open: boolean;
  title: string;
  company: string | null;
  busy: boolean;
  onYes: () => void;
  onNotYet: () => void;
  onLater: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 sm:items-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-confirm-title"
            className="w-full max-w-md rounded-2xl border border-guava-pink/20 bg-white p-6 shadow-[0_24px_64px_-24px_rgb(0_0_0_/_0.28)]"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <h2
              id="apply-confirm-title"
              className="text-lg font-semibold tracking-tight"
            >
              Did you apply?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {title}
              {company ? ` at ${company}` : ""} — mark it applied only if you
              submitted on the employer site.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onYes}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy ? (
                  <CircleNotch className="size-4 animate-spin" weight="bold" />
                ) : (
                  <CheckCircle className="size-4" weight="duotone" />
                )}
                Yes, I applied
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onNotYet}
                className="rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium"
              >
                Not yet
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onLater}
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                Save for later
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ApplyPanel({ app }: { app: ApplicationResponse }) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const title = applicationTitle(app);
  const company = applicationCompany(app);
  const alreadyApplied = app.status !== "DRAFT";

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(`/applications/${app.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          status: "APPLIED",
          appliedAt: new Date().toISOString(),
        }),
      });
    },
    onSuccess: (data) => {
      setConfirmOpen(false);
      queryClient.setQueryData(
        ["application", app.id],
        (old: ApplicationResponse | undefined) => ({
          ...data,
          events: data.events ?? old?.events,
        }),
      );
      void queryClient.invalidateQueries({ queryKey: ["application", app.id] });
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      track(AnalyticsEvents.apply_confirmed, { applicationId: app.id });
      track(AnalyticsEvents.application_status_changed, {
        applicationId: app.id,
        status: "APPLIED",
      });
    },
  });

  async function downloadPdf() {
    setPdfError(null);
    setPdfBusy(true);
    try {
      const token = await getAccessToken();
      const blob = await apiFetchBlob(
        `/applications/${app.id}/cover-letter/pdf`,
        { method: "POST", token },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cover-letter-${app.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      track(AnalyticsEvents.pdf_exported, { applicationId: app.id });
    } catch (err) {
      setPdfError(
        err instanceof ApiError
          ? err.message
          : "Could not download PDF. Try again.",
      );
    } finally {
      setPdfBusy(false);
    }
  }

  function openApply() {
    if (!app.applyUrl) return;
    window.open(app.applyUrl, "_blank", "noopener,noreferrer");
    track(AnalyticsEvents.apply_opened, {
      applicationId: app.id,
      canonicalJobKey: app.canonicalJobKey,
    });
    if (!alreadyApplied) {
      setConfirmOpen(true);
    }
  }

  return (
    <>
      <PaperPanel className="border-guava-green/20 p-5 md:p-6">
        <h2 className="text-base font-semibold tracking-tight">Apply</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We open the employer page — you submit there. GuavaJobs never
          auto-submits.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {app.applyUrl ? (
            <button
              type="button"
              onClick={openApply}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98]"
            >
              Apply now
              <ArrowSquareOut className="size-4" weight="bold" />
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              No apply URL on this entry. Add one via status fields or mark
              applied manually below.
            </p>
          )}

          {app.coverLetterContent ? (
            <button
              type="button"
              disabled={pdfBusy}
              onClick={() => void downloadPdf()}
              className="inline-flex items-center gap-2 rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:border-guava-green/45 disabled:opacity-50"
            >
              {pdfBusy ? (
                <CircleNotch className="size-4 animate-spin" weight="bold" />
              ) : (
                <FilePdf className="size-4" weight="duotone" />
              )}
              Download PDF
            </button>
          ) : null}

          {app.applyUrl && alreadyApplied ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              Update applied status
            </button>
          ) : null}
        </div>

        {pdfError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {pdfError}
          </p>
        ) : null}

        {confirmMutation.isError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {confirmMutation.error instanceof ApiError
              ? confirmMutation.error.message
              : "Could not update status."}
          </p>
        ) : null}
      </PaperPanel>

      <ApplyConfirmSheet
        open={confirmOpen}
        title={title}
        company={company}
        busy={confirmMutation.isPending}
        onYes={() => confirmMutation.mutate()}
        onNotYet={() => {
          track(AnalyticsEvents.apply_deferred, {
            applicationId: app.id,
            choice: "not_yet",
          });
          setConfirmOpen(false);
        }}
        onLater={() => {
          track(AnalyticsEvents.apply_deferred, {
            applicationId: app.id,
            choice: "later",
          });
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
