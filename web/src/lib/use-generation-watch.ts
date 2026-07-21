"use client";

import { useEffect, useState } from "react";
import {
  isGenerationPending,
  listPendingGenerations,
  pendingGenerationsForApplication,
  type GenerationWatchKind,
  type PendingGeneration,
} from "@/lib/generation-watch";

/** Reactive pending state for one application + optional kind. */
export function useGenerationWatch(
  applicationId: string,
  kind?: GenerationWatchKind,
): boolean {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function sync() {
      setPending(isGenerationPending(applicationId, kind));
    }
    sync();
    window.addEventListener("gj-generation-watch", sync);
    return () => window.removeEventListener("gj-generation-watch", sync);
  }, [applicationId, kind]);

  return pending;
}

/** All pending watches for an application (any kind). */
export function usePendingGenerationsForApplication(
  applicationId: string,
): PendingGeneration[] {
  const [rows, setRows] = useState<PendingGeneration[]>([]);

  useEffect(() => {
    function sync() {
      setRows(pendingGenerationsForApplication(applicationId));
    }
    sync();
    window.addEventListener("gj-generation-watch", sync);
    return () => window.removeEventListener("gj-generation-watch", sync);
  }, [applicationId]);

  return rows;
}

/** Global pending list — used by tracker and shell chrome. */
export function usePendingGenerations(): PendingGeneration[] {
  const [rows, setRows] = useState<PendingGeneration[]>([]);

  useEffect(() => {
    function sync() {
      setRows(listPendingGenerations());
    }
    sync();
    window.addEventListener("gj-generation-watch", sync);
    return () => window.removeEventListener("gj-generation-watch", sync);
  }, []);

  return rows;
}
