"use client";

import { useEffect, useState } from "react";
import { paperInputClass, PaperPanel } from "@/components/ui/paper-panel";

export function CoverLetterEditor({
  content,
  edited,
  saving,
  saveError,
  onSave,
}: {
  content: string;
  edited: boolean;
  saving: boolean;
  saveError: string | null;
  onSave: (next: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(content);
  const dirty = draft !== content;

  useEffect(() => {
    setDraft(content);
  }, [content]);

  return (
    <PaperPanel className="border-guava-pink/15 p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">Cover letter</h2>
        <p className="text-xs text-muted-foreground">
          {edited || dirty
            ? "Edited by you — honesty still applies"
            : "AI draft from your profile + CV"}
        </p>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Cover letter text</span>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={18}
          className={`${paperInputClass} min-h-[22rem] resize-y font-sans leading-relaxed`}
          spellCheck
        />
      </label>

      {saveError ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => void onSave(draft)}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save edits"}
        </button>
        {dirty ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => setDraft(content)}
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            Discard
          </button>
        ) : null}
      </div>
    </PaperPanel>
  );
}
