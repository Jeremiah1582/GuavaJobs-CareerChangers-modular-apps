import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Applications",
  robots: { index: false, follow: false },
};

export default function ApplicationsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tracker ships in M3 via{" "}
        <code className="font-mono text-xs">GET /applications</code>.
      </p>
    </main>
  );
}
