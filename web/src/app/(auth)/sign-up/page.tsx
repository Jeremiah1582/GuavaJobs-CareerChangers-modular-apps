import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-guava-pink">GuavaJobs</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Create account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        After signup we sync your user via{" "}
        <code className="font-mono text-xs">GET /me</code>.
      </p>
      <div className="mt-8">
        <AuthForm mode="sign-up" nextPath="/onboarding" />
      </div>
    </main>
  );
}
