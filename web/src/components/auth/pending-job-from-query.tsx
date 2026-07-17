"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setPendingJobCookie } from "@/lib/pending-job";

/** Ensures ?job= from the apply gate URL is stored even if the cookie was missing. */
export function PendingJobFromQuery() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const job = searchParams.get("job")?.trim();
    if (job) setPendingJobCookie(job);
  }, [searchParams]);

  return null;
}
