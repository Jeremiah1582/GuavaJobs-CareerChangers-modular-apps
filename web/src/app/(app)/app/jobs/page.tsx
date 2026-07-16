import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jobs",
  robots: { index: false, follow: false },
};

export default function JobsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
      <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
        Search and generate land in M2. Your profile and CV are ready — hang
        tight while we wire the Adzuna feed.
      </p>
      <div className="mt-10 border-t border-border pt-8">
        <p className="text-sm text-muted-foreground">
          Meanwhile, check{" "}
          <a
            href="/app/profile"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Profile
          </a>{" "}
          for quota and CV status.
        </p>
      </div>
    </main>
  );
}
