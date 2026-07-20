const STORAGE_KEY = "gj_pending_generations";

export type PendingGeneration = {
  id: string;
  title: string;
  startedAt: number;
};

function readAll(): PendingGeneration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is PendingGeneration =>
        !!row &&
        typeof row === "object" &&
        typeof (row as PendingGeneration).id === "string" &&
        typeof (row as PendingGeneration).title === "string" &&
        typeof (row as PendingGeneration).startedAt === "number",
    );
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

export function watchGeneration(id: string, title: string) {
  const rows = readAll().filter((row) => row.id !== id);
  rows.push({ id, title, startedAt: Date.now() });
  writeAll(rows);
  window.dispatchEvent(new CustomEvent("gj-generation-watch"));
}

export function unwatchGeneration(id: string) {
  writeAll(readAll().filter((row) => row.id !== id));
  window.dispatchEvent(new CustomEvent("gj-generation-watch"));
}

export function listPendingGenerations(): PendingGeneration[] {
  return readAll();
}

export function notifyGenerationComplete(title: string, applicationId: string) {
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification("Application package ready", {
      body: title,
      tag: `gj-gen-${applicationId}`,
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
