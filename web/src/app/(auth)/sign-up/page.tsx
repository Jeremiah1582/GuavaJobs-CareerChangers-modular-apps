import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create account"
      description="After signup we sync your user via GET /me and walk you through onboarding."
    >
      <AuthForm mode="sign-up" nextPath="/onboarding" />
    </AuthShell>
  );
}
