"use client";

import { FormEvent, useState } from "react";

export function StepName({
  initialName,
  onContinue,
}: {
  initialName: string;
  onContinue: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError("Enter the name you want on applications.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onContinue(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save name");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          What should we call you?
        </h2>
        <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
          This is your account display name — not a job title. You can change it
          later.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">Display name</span>
        <input
          type="text"
          autoComplete="name"
          autoFocus
          required
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-input bg-card px-3 py-2.5 text-foreground outline-none ring-ring focus:ring-2"
          placeholder="e.g. Amara Okonkwo"
        />
        <span className="text-xs text-muted-foreground">
          Shown on your profile and in the app shell.
        </span>
      </label>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
