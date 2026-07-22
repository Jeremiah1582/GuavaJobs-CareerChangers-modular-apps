"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";
import type { JobListItem, SavedJobResolveStatus } from "@/api/types";
import { JobCard } from "@/components/jobs/job-card";
import { JobDetailPanel } from "@/components/jobs/job-detail-panel";
import { normalizeBookmarkKey } from "@/lib/jobs";

/** Scrollable pane with hidden scrollbars (wheel / trackpad still work). */
const SCROLL_PANE =
  "min-h-0 overflow-y-auto overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function useIsLgDesktop() {
  const [isLg, setIsLg] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isLg;
}

type JobsBoardProps = {
  jobs: JobListItem[];
  loading: boolean;
  selectedKey: string | null;
  onSelect: (canonicalKey: string) => void;
  onClear: () => void;
  mode?: "app" | "public";
  emptyMessage?: string;
  /** Pagination / attribution pinned below the desktop split pane */
  footer?: ReactNode;
  bookmarkedKeys?: Set<string>;
  onToggleBookmark?: (job: JobListItem) => void;
  bookmarkPendingKey?: string | null;
  resolveStatusByKey?: Record<string, SavedJobResolveStatus>;
};

export function JobsBoard({
  jobs,
  loading,
  selectedKey,
  onSelect,
  onClear,
  mode = "app",
  emptyMessage = "No jobs found. Try a different search.",
  footer,
  bookmarkedKeys,
  onToggleBookmark,
  bookmarkPendingKey,
  resolveStatusByKey,
}: JobsBoardProps) {
  const reduceMotion = useReducedMotion();
  const isLgDesktop = useIsLgDesktop();
  const animateDesktopDetail = isLgDesktop && !reduceMotion;

  const activeJob =
    jobs.find((job) => job.canonicalKey === selectedKey) ?? null;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <CircleNotch
          className="size-6 animate-spin text-guava-green"
          weight="bold"
        />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-guava-green/15 bg-guava-green/5 px-4 py-16 text-center">
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-guava-green/10">
          <MagnifyingGlass
            className="size-5 text-guava-green"
            weight="duotone"
          />
        </div>
        <p className="text-sm font-medium text-foreground">No jobs found</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const listItems = jobs.map((job) => (
    <li key={job.canonicalKey}>
      <JobCard
        job={job}
        isSelected={activeJob?.canonicalKey === job.canonicalKey}
        onSelect={onSelect}
        bookmarked={bookmarkedKeys?.has(normalizeBookmarkKey(job.canonicalKey))}
        onToggleBookmark={onToggleBookmark}
        bookmarkPending={
          bookmarkPendingKey === job.canonicalKey ||
          bookmarkPendingKey === normalizeBookmarkKey(job.canonicalKey)
        }
        resolveStatus={resolveStatusByKey?.[normalizeBookmarkKey(job.canonicalKey)]}
      />
    </li>
  ));

  const boardShell =
    "rounded-2xl border border-guava-green/15 bg-gradient-to-br from-guava-green/[0.07] via-white/50 to-background";

  return (
    <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-3 overflow-x-hidden">
      {/* Desktop: viewport-height split pane; list + detail scroll independently */}
      <div
        className={`hidden min-w-0 max-w-full overflow-hidden p-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col ${boardShell}`}
      >
        <div
          className={[
            "grid min-h-0 min-w-0 flex-1 gap-4 overflow-hidden",
            activeJob
              ? "grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
              : "grid-cols-1",
          ].join(" ")}
        >
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <ul className={`min-w-0 flex-1 space-y-2.5 pr-1 ${SCROLL_PANE}`}>
              {listItems}
            </ul>
          </div>

          <AnimatePresence initial={false}>
            {activeJob ? (
              <motion.div
                key={activeJob.canonicalKey}
                layout={animateDesktopDetail}
                initial={
                  animateDesktopDetail
                    ? { opacity: 0, x: 16, scale: 0.98 }
                    : false
                }
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={
                  animateDesktopDetail
                    ? { opacity: 0, x: 16, scale: 0.98 }
                    : { opacity: 0 }
                }
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-guava-green/20 bg-white/95 p-4 shadow-sm md:p-5"
              >
                <JobDetailPanel
                  summary={activeJob}
                  showBack
                  onBack={onClear}
                  backClassName="lg:hidden"
                  mode={mode}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {footer ? (
          <div className="mt-3 min-w-0 shrink-0 space-y-2 border-t border-guava-green/10 pt-3">
            {footer}
          </div>
        ) : null}
      </div>

      {/* Tablet: document scroll; detail replaces list when open */}
      <div
        className={`hidden min-w-0 max-w-full gap-4 overflow-x-hidden p-3 md:grid md:grid-cols-1 md:p-4 ${boardShell} lg:hidden`}
      >
        <ul
          className={[
            "min-w-0 space-y-2.5 md:pr-1",
            activeJob ? "hidden" : "block",
          ].join(" ")}
        >
          {listItems}
        </ul>

        <AnimatePresence initial={false}>
          {activeJob ? (
            <motion.div
              key={activeJob.canonicalKey}
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-guava-green/20 bg-white/95 p-4 shadow-sm md:p-5"
            >
              <JobDetailPanel
                summary={activeJob}
                showBack
                onBack={onClear}
                mode={mode}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Phone: scrollable list */}
      <ul className="min-w-0 space-y-2.5 md:hidden">
        {listItems}
      </ul>

      {/* Phone: full-viewport detail */}
      {activeJob ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[var(--background)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Job details"
        >
          <div className="flex min-h-0 flex-1 flex-col px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-guava-green/20 bg-white p-4 shadow-sm">
              <JobDetailPanel
                summary={activeJob}
                showBack
                onBack={onClear}
                lockBodyScroll
                mode={mode}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
