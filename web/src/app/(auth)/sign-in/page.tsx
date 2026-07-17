import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/")
      ? params.next
      : "/onboarding";

  return (
    <AuthShell
      title="Sign in"
      description="Use the same Supabase account that talks to the GuavaJobs API."
    >
      <AuthForm mode="sign-in" nextPath={nextPath} />
    </AuthShell>
  );
}
