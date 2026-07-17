import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { PendingJobFromQuery } from "@/components/auth/pending-job-from-query";
import { APPLY_GATE_COPY } from "@/lib/pending-job";

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?: string; job?: string }>;
}) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/")
      ? params.next
      : "/onboarding";
  const isApplyIntent = params.intent === "apply";

  return (
    <AuthShell
      title="Create account"
      description={
        isApplyIntent
          ? APPLY_GATE_COPY
          : "After signup we sync your user via GET /me and walk you through onboarding."
      }
    >
      <Suspense fallback={null}>
        <PendingJobFromQuery />
      </Suspense>
      <AuthForm mode="sign-up" nextPath={nextPath} />
    </AuthShell>
  );
}
