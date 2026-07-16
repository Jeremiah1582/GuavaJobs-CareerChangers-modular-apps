import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-guava-pink">GuavaJobs</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Reset password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We will email a reset link if that account exists.
      </p>
      <div className="mt-8">
        <AuthForm mode="forgot-password" />
      </div>
    </main>
  );
}
