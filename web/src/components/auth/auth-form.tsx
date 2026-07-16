"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/api/client";
import { AnalyticsEvents, track } from "@/lib/analytics";

type Mode = "sign-in" | "sign-up" | "forgot-password";

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
          },
        });
        if (signUpError) throw signUpError;

        const token = data.session?.access_token;
        if (token) {
          await apiFetch("/me", { token });
          track(AnalyticsEvents.signup_completed);
          router.replace(nextPath);
          router.refresh();
          return;
        }

        setInfo(
          "Account created. Confirm your email if required, then sign in.",
        );
        return;
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const token = data.session?.access_token;
      if (!token) throw new Error("No session returned after sign in");

      await apiFetch("/me", { token });
      track(AnalyticsEvents.login_completed);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
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
            className="rounded-lg border border-input bg-card px-3 py-2 text-foreground outline-none ring-ring focus:ring-2"
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
          className="rounded-lg border border-input bg-card px-3 py-2 text-foreground outline-none ring-ring focus:ring-2"
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
            className="rounded-lg border border-input bg-card px-3 py-2 text-foreground outline-none ring-ring focus:ring-2"
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

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {pending
          ? "Please wait…"
          : mode === "sign-in"
            ? "Sign in"
            : mode === "sign-up"
              ? "Create account"
              : "Send reset link"}
      </button>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {mode !== "sign-in" ? (
          <Link href="/sign-in" className="hover:text-foreground">
            Sign in
          </Link>
        ) : null}
        {mode !== "sign-up" ? (
          <Link href="/sign-up" className="hover:text-foreground">
            Create account
          </Link>
        ) : null}
        {mode !== "forgot-password" ? (
          <Link href="/forgot-password" className="hover:text-foreground">
            Forgot password
          </Link>
        ) : null}
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
      </div>
    </form>
  );
}
