import type { ApplicationStatus } from "@/api/types";
import { STATUS_LABELS } from "@/lib/applications";

const tone: Record<ApplicationStatus, string> = {
  DRAFT: "border-guava-pink/30 bg-guava-pink/8 text-foreground",
  APPLIED: "border-guava-green/35 bg-guava-green/10 text-guava-green",
  INTERVIEWING: "border-guava-green/40 bg-guava-green/15 text-guava-green",
  OFFER: "border-guava-green/45 bg-guava-green/18 text-guava-green",
  OFFER_ACCEPTED: "border-guava-green/50 bg-guava-green/20 text-guava-green",
  OFFER_DECLINED: "border-muted-foreground/20 bg-muted text-muted-foreground",
  HIRED: "border-guava-green/50 bg-guava-green/20 text-guava-green",
  REJECTED: "border-destructive/25 bg-destructive/5 text-destructive",
  WITHDRAWN: "border-muted-foreground/20 bg-muted text-muted-foreground",
  ARCHIVED: "border-muted-foreground/15 bg-muted/80 text-muted-foreground",
};

export function StatusChip({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const key = status as ApplicationStatus;
  const label = STATUS_LABELS[key] ?? status;
  const colors = tone[key] ?? "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={[
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        colors,
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
