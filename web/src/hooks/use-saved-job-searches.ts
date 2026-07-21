"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadSavedJobSearches,
  removeSavedJobSearch,
  saveJobSearch,
  type SavedJobSearch,
} from "@/lib/saved-job-searches";

export function useSavedJobSearches(enabled = true) {
  const [savedSearches, setSavedSearches] = useState<SavedJobSearch[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setSavedSearches([]);
      setHydrated(true);
      return;
    }
    setSavedSearches(loadSavedJobSearches());
    setHydrated(true);
  }, [enabled]);

  const saveCurrent = useCallback(
    (input: { q: string; location: string; country: string; label?: string }) => {
      const next = saveJobSearch(input);
      setSavedSearches(next);
      return next;
    },
    [],
  );

  const remove = useCallback((id: string) => {
    const next = removeSavedJobSearch(id);
    setSavedSearches(next);
    return next;
  }, []);

  return { savedSearches, saveCurrent, remove, hydrated };
}
