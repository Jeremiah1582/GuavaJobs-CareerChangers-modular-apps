import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

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
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-guava-pink">GuavaJobs</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Use the same Supabase account that talks to the Coolify API.
      </p>
      <div className="mt-8">
        <AuthForm mode="sign-in" nextPath={nextPath} />
      </div>
    </main>
  );
}
