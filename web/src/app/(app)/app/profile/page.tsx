import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/api/client";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

type MeResponse = {
  id: string;
  email: string;
  name: string;
  tier: string;
  defaultProfileId: string | null;
  usage: {
    tier: string;
    aiGenerationsUsedPeriod: number;
    aiGenerationsLimit: number | null;
  };
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/sign-in?next=/app/profile");
  }

  let me: MeResponse | null = null;
  let loadError: string | null = null;

  try {
    me = await apiFetch<MeResponse>("/me", { token: session.access_token });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await supabase.auth.signOut();
      redirect("/sign-in?next=/app/profile");
    }
    loadError = err instanceof Error ? err.message : "Failed to load profile";
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Synced from the Coolify API via{" "}
        <code className="font-mono text-xs">GET /me</code>.
      </p>

      {loadError ? (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {loadError}. Check that the API is reachable and CORS is deployed.
        </p>
      ) : null}

      {me ? (
        <dl className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">Name</dt>
            <dd className="sm:col-span-2 text-sm font-medium">{me.name}</dd>
          </div>
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="sm:col-span-2 font-mono text-sm">{me.email}</dd>
          </div>
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">Tier</dt>
            <dd className="sm:col-span-2 text-sm font-medium">{me.tier}</dd>
          </div>
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">AI quota</dt>
            <dd className="sm:col-span-2 font-mono text-sm">
              {me.usage.aiGenerationsUsedPeriod}
              {me.usage.aiGenerationsLimit != null
                ? ` / ${me.usage.aiGenerationsLimit}`
                : " / unlimited"}
            </dd>
          </div>
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">Default profile</dt>
            <dd className="sm:col-span-2 font-mono text-xs break-all">
              {me.defaultProfileId ?? "none"}
            </dd>
          </div>
        </dl>
      ) : null}
    </main>
  );
}
