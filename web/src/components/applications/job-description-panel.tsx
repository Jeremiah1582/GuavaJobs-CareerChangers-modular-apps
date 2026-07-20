"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowClockwise,
  CaretDown,
  Check,
  CircleNotch,
  PencilSimple,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiFetch, ApiError } from "@/api/client";
import type { ApplicationResponse } from "@/api/types";
import { PaperPanel, paperInputClass } from "@/components/ui/paper-panel";
import {
  effectiveJobDescription,
  hasFullJobDescription,
} from "@/lib/applications";
import { getAccessToken } from "@/lib/session";

function truncatePreview(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trimEnd()}…`;
}

export function JobDescriptionPanel({
  app,
  onRequestRegenerate,
  canRegenerate,
}: {
  app: ApplicationResponse;
  onRequestRegenerate?: () => void;
  canRegenerate?: boolean;
}) {
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [showRegenBanner, setShowRegenBanner] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const effective = effectiveJobDescription(app);
  const hasPasted = !!(app.pastedJobDescription ?? "").trim();
  const hasFull = hasFullJobDescription(app);

  useEffect(() => {
    if (!editing) {
      setDraft(effective);
    }
  }, [effective, editing, app.updatedAt]);

  const saveMutation = useMutation({
    mutationFn: async (pastedJobDescription: string) => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(`/applications/${app.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ pastedJobDescription }),
      });
    },
    onSuccess: (data) => {
      setSaveError(null);
      setEditing(false);
      setShowRegenBanner(true);
      setExpanded(true);
      queryClient.setQueryData(
        ["application", app.id],
        (old: ApplicationResponse | undefined) => ({
          ...data,
          events: data.events ?? old?.events,
        }),
      );
    },
    onError: (err) => {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "Could not save description. Try again.",
      );
    },
  });

  function startEdit() {
    setDraft(effective);
    setEditing(true);
    setExpanded(true);
    setSaveError(null);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(effective);
    setSaveError(null);
  }

  const preview = effective
    ? truncatePreview(effective)
    : "No job description yet — paste the full listing text.";

  return (
    <PaperPanel className="border-guava-pink/15 p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => {
          if (editing) return;
          setExpanded((v) => !v);
        }}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-guava-pink/[0.03] md:px-6"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">
              Job description
            </h2>
            {hasPasted ? (
              <span className="rounded-md border border-guava-green/25 bg-guava-green/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-guava-green">
                Full text saved
              </span>
            ) : hasFull ? (
              <span className="rounded-md border border-guava-pink/20 bg-guava-pink/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                From listing
              </span>
            ) : (
              <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Shortened
              </span>
            )}
          </div>
          {!expanded && !editing ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {preview}
            </p>
          ) : null}
        </div>
        <CaretDown
          className={[
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            expanded || editing ? "rotate-180" : "",
          ].join(" ")}
          weight="bold"
        />
      </button>

      <div
        className={[
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          reduce ? "duration-0" : "",
          expanded || editing ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-guava-pink/10 px-5 pb-5 pt-4 md:px-6">
            {editing ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="sr-only">Edit job description</span>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={12}
                    className={`${paperInputClass} min-h-[14rem] resize-y font-sans leading-relaxed`}
                    placeholder="Paste the full job description from the board…"
                    autoFocus
                  />
                </label>
                {saveError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {saveError}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={saveMutation.isPending || !draft.trim()}
                    onClick={() => saveMutation.mutate(draft.trim())}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 active:scale-[0.98]"
                    title="Save"
                  >
                    {saveMutation.isPending ? (
                      <CircleNotch className="size-4 animate-spin" weight="bold" />
                    ) : (
                      <Check className="size-4" weight="bold" />
                    )}
                    Save
                  </button>
                  <button
                    type="button"
                    disabled={saveMutation.isPending}
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
                    title="Cancel"
                  >
                    <X className="size-4" weight="bold" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {effective ? (
                  <div className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {effective}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No description on file. Paste the full listing so letter and
                    CV generation can use it.
                  </p>
                )}
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-2 text-sm font-medium transition-colors hover:border-guava-green/45 active:scale-[0.98]"
                >
                  <PencilSimple className="size-4" weight="bold" />
                  Edit description
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showRegenBanner && canRegenerate ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-guava-green/15 bg-guava-green/5 px-5 py-3 md:px-6"
            role="status"
          >
            <p className="text-sm text-foreground">
              Description updated. Regenerate to refresh letter and fit report.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRegenBanner(false);
                  onRequestRegenerate?.();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground active:scale-[0.98]"
              >
                <ArrowClockwise className="size-3.5" weight="bold" />
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => setShowRegenBanner(false)}
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PaperPanel>
  );
}
