const STORAGE_KEY = "gj_pending_generations";

/** Soft client watch timeout — server job may still finish. */
export const GENERATION_WATCH_TIMEOUT_MS = 12 * 60 * 1000;

export type GenerationWatchKind = "package" | "cv" | "ats";

export type PendingGeneration = {
  id: string;
  kind: GenerationWatchKind;
  title: string;
  startedAt: number;
  /** Snapshot at enqueue — used for cv/ats completion detection. */
  baselineAt?: string | null;
};

export type WatchGenerationInput = {
  id: string;
  kind: GenerationWatchKind;
  title: string;
  baselineAt?: string | null;
};

export function watchKey(id: string, kind: GenerationWatchKind): string {
  return `${id}:${kind}`;
}

function normalizeRow(row: Record<string, unknown>): PendingGeneration | null {
  if (typeof row.id !== "string" || typeof row.title !== "string") return null;
  if (typeof row.startedAt !== "number") return null;
  const kind =
    row.kind === "package" || row.kind === "cv" || row.kind === "ats"
      ? row.kind
      : "package";
  const baselineAt =
    row.baselineAt === undefined
      ? undefined
      : row.baselineAt === null
        ? null
        : typeof row.baselineAt === "string"
          ? row.baselineAt
          : undefined;
  return { id: row.id, kind, title: row.title, startedAt: row.startedAt, baselineAt };
}

function readAll(): PendingGeneration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) =>
        row && typeof row === "object"
          ? normalizeRow(row as Record<string, unknown>)
          : null,
      )
      .filter((row): row is PendingGeneration => row != null);
  } catch {
    return [];
  }
}

function writeAll(rows: PendingGeneration[]) {
  if (typeof window === "undefined") return;
  if (rows.length === 0) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function dispatchWatchChange() {
  window.dispatchEvent(new CustomEvent("gj-generation-watch"));
}

export function watchGeneration(input: WatchGenerationInput) {
  const key = watchKey(input.id, input.kind);
  const rows = readAll().filter(
    (row) => watchKey(row.id, row.kind) !== key,
  );
  rows.push({
    id: input.id,
    kind: input.kind,
    title: input.title,
    startedAt: Date.now(),
    baselineAt: input.baselineAt,
  });
  writeAll(rows);
  dispatchWatchChange();
}

export function unwatchGeneration(id: string, kind: GenerationWatchKind) {
  const key = watchKey(id, kind);
  writeAll(
    readAll().filter((row) => watchKey(row.id, row.kind) !== key),
  );
  dispatchWatchChange();
}

export function listPendingGenerations(): PendingGeneration[] {
  return readAll();
}

export function isGenerationPending(
  applicationId: string,
  kind?: GenerationWatchKind,
): boolean {
  const rows = readAll();
  if (kind) {
    return rows.some((row) => row.id === applicationId && row.kind === kind);
  }
  return rows.some((row) => row.id === applicationId);
}

export function pendingGenerationsForApplication(
  applicationId: string,
): PendingGeneration[] {
  return readAll().filter((row) => row.id === applicationId);
}

function notificationTitle(kind: GenerationWatchKind): string {
  switch (kind) {
    case "package":
      return "Application package ready";
    case "cv":
      return "Tailored CV ready";
    case "ats":
      return "Fit report updated";
  }
}

export function notifyGenerationComplete(
  kind: GenerationWatchKind,
  title: string,
  applicationId: string,
) {
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(notificationTitle(kind), {
      body: title,
      tag: `gj-gen-${watchKey(applicationId, kind)}`,
    });
  } catch {
    // Ignore — notifications are optional.
  }
}

export async function requestGenerationNotificationPermission() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "default") return;
  try {
    await Notification.requestPermission();
  } catch {
    // User dismissed or browser blocked.
  }
}
