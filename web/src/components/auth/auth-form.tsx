"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch, ApiError } from "@/api/client";
import { AnalyticsEvents, identifyAnalyticsUser, track } from "@/lib/analytics";
import { paperInputClass } from "@/components/ui/paper-panel";

type Mode = "sign-in" | "sign-up" | "forgot-password";

function authErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong";
  const msg = err.message || "";
  const lower = msg.toLowerCase();

  if (
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed")
  ) {
    return "Email not confirmed. Open the link in your inbox, or in Supabase Dashboard → Authentication → Providers → Email → turn off Confirm email for local dev.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Wrong email or password.";
  }
  if (err instanceof ApiError && err.status === 0) {
    return msg;
  }
  return msg;
}

const submitClass =
  "w-full rounded-xl bg-gradient-to-br from-[oklch(0.68_0.13_150)] via-[oklch(0.58_0.16_150)] to-[oklch(0.48_0.13_155)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--guava-green)_70%,transparent)] transition-[filter,transform] hover:brightness-[1.05] active:scale-[0.98] disabled:opacity-60";

export function AuthForm({
  mode,
  nextPath = "/onboarding",
}: {
  mode: Mode;
  nextPath?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    try {
      const supabase = createClient();

      if (mode === "forgot-password") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/sign-in`,
          },
        );
        if (resetError) throw resetError;
        setInfo("Check your email for a reset link.");
        return;
      }

      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() || undefined },
            emailRedirectTo: `${window.location.origin}/sign-in`,
          },
        });
        if (signUpError) throw signUpError;

        const token = data.session?.access_token;
        if (token) {
          await apiFetch("/me", { token });
          identifyAnalyticsUser(data.user?.id ?? data.session?.user?.id ?? "");
          track(AnalyticsEvents.signup_completed);
          router.replace(nextPath);
          router.refresh();
          return;
        }

        setInfo(
          "Account created, but Supabase requires email confirmation before you can sign in. Check your inbox, or disable Confirm email in the Supabase Auth settings for local development.",
        );
        return;
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const token = data.session?.access_token;
      if (!token) throw new Error("No session returned after sign in");

      await apiFetch("/me", { token });
      identifyAnalyticsUser(data.user?.id ?? data.session?.user?.id ?? "");
      track(AnalyticsEvents.login_completed);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {mode === "sign-up" ? (
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Name</span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={paperInputClass}
            placeholder="Your name"
          />
        </label>
      ) : null}

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={paperInputClass}
          placeholder="you@example.com"
        />
      </label>

      {mode !== "forgot-password" ? (
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={paperInputClass}
            placeholder="At least 8 characters"
          />
        </label>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-guava-green" role="status">
          {info}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={submitClass}>
        {pending
          ? "Please wait…"
          : mode === "sign-in"
            ? "Sign in"
            : mode === "sign-up"
              ? "Create account"
              : "Send reset link"}
      </button>

      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-guava-green/10 pt-4 text-sm text-muted-foreground">
        {mode !== "sign-in" ? (
          <Link href="/sign-in" className="hover:text-guava-green">
            Sign in
          </Link>
        ) : null}
        {mode !== "sign-up" ? (
          <Link href="/sign-up" className="hover:text-guava-green">
            Create account
          </Link>
        ) : null}
        {mode !== "forgot-password" ? (
          <Link href="/forgot-password" className="hover:text-guava-green">
            Forgot password
          </Link>
        ) : null}
      </div>
    </form>
  );
}
