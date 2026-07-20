"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BracketsCurly,
  Check,
  CircleNotch,
  FileText,
  PencilSimple,
  Plus,
  Sparkle,
  Trash,
  X,
} from "@phosphor-icons/react";
import { apiFetch, ApiError } from "@/api/client";
import type {
  ApplicationResponse,
  GeneratedCvContent,
  GeneratedCvWorkEntry,
} from "@/api/types";
import { QuotaSheet } from "@/components/applications/quota-sheet";
import { PaperPanel, paperInputClass } from "@/components/ui/paper-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { effectiveJobDescription } from "@/lib/applications";
import { getAccessToken } from "@/lib/session";

function Section({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {actions}
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function emptyWork(): GeneratedCvWorkEntry {
  return {
    position: "",
    name: "",
    location: null,
    startDate: null,
    endDate: null,
    highlights: [""],
  };
}

function cloneContent(content: GeneratedCvContent): GeneratedCvContent {
  return structuredClone(content);
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex size-8 items-center justify-center rounded-lg border transition-colors active:scale-[0.98] disabled:opacity-40",
        danger
          ? "border-destructive/25 text-destructive hover:bg-destructive/5"
          : "border-guava-green/20 text-muted-foreground hover:border-guava-green/40 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StructuredCvView({
  content,
  editing,
  draft,
  onChange,
  showAllWork,
  onShowAllWork,
}: {
  content: GeneratedCvContent;
  editing: boolean;
  draft: GeneratedCvContent | null;
  onChange: (next: GeneratedCvContent) => void;
  showAllWork: boolean;
  onShowAllWork: () => void;
}) {
  const data = editing && draft ? draft : content;
  const work = data.work ?? [];
  const visibleWork =
    editing || showAllWork ? work : work.slice(0, 2);
  const hiddenCount = !editing && !showAllWork ? Math.max(0, work.length - 2) : 0;

  function patch(partial: Partial<GeneratedCvContent>) {
    if (!draft) return;
    onChange({ ...draft, ...partial });
  }

  return (
    <div className="space-y-5">
      <Section title="Target role">
        {editing && draft ? (
          <input
            className={paperInputClass}
            value={draft.label ?? ""}
            onChange={(e) =>
              patch({ label: e.target.value || null })
            }
            placeholder="Target role"
          />
        ) : (
          <p>{data.label ?? "—"}</p>
        )}
      </Section>

      {(editing || data.summary) && (
        <Section title="Summary">
          {editing && draft ? (
            <textarea
              className={`${paperInputClass} min-h-[5rem] resize-y`}
              value={draft.summary ?? ""}
              onChange={(e) =>
                patch({ summary: e.target.value || null })
              }
              placeholder="Professional summary"
            />
          ) : (
            <p>{data.summary}</p>
          )}
        </Section>
      )}

      {(editing || data.coreCompetencies.length > 0) && (
        <Section
          title="Core competencies"
          actions={
            editing ? (
              <IconBtn
                label="Add competency"
                onClick={() =>
                  patch({
                    coreCompetencies: [...draft!.coreCompetencies, ""],
                  })
                }
              >
                <Plus className="size-3.5" weight="bold" />
              </IconBtn>
            ) : null
          }
        >
          {editing && draft ? (
            <ul className="space-y-2">
              {draft.coreCompetencies.map((item, i) => (
                <li key={`comp-${i}`} className="flex gap-2">
                  <input
                    className={paperInputClass}
                    value={item}
                    onChange={(e) => {
                      const next = [...draft.coreCompetencies];
                      next[i] = e.target.value;
                      patch({ coreCompetencies: next });
                    }}
                  />
                  <IconBtn
                    label="Remove"
                    danger
                    onClick={() =>
                      patch({
                        coreCompetencies: draft.coreCompetencies.filter(
                          (_, j) => j !== i,
                        ),
                      })
                    }
                  >
                    <Trash className="size-3.5" weight="bold" />
                  </IconBtn>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {data.coreCompetencies.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {(editing || work.length > 0) && (
        <Section
          title="Experience"
          actions={
            editing ? (
              <IconBtn
                label="Add role"
                onClick={() =>
                  patch({ work: [...draft!.work, emptyWork()] })
                }
              >
                <Plus className="size-3.5" weight="bold" />
              </IconBtn>
            ) : null
          }
        >
          <ul className="space-y-4">
            {visibleWork.map((role, ri) => (
              <li
                key={`work-${ri}-${role.name}-${role.position}`}
                className={
                  editing
                    ? "space-y-2 rounded-xl border border-guava-green/15 p-3"
                    : undefined
                }
              >
                {editing && draft ? (
                  <>
                    <div className="flex justify-end">
                      <IconBtn
                        label="Remove role"
                        danger
                        onClick={() =>
                          patch({
                            work: draft.work.filter((_, j) => j !== ri),
                          })
                        }
                      >
                        <Trash className="size-3.5" weight="bold" />
                      </IconBtn>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        className={paperInputClass}
                        placeholder="Position"
                        value={role.position}
                        onChange={(e) => {
                          const next = [...draft.work];
                          next[ri] = { ...role, position: e.target.value };
                          patch({ work: next });
                        }}
                      />
                      <input
                        className={paperInputClass}
                        placeholder="Company"
                        value={role.name}
                        onChange={(e) => {
                          const next = [...draft.work];
                          next[ri] = { ...role, name: e.target.value };
                          patch({ work: next });
                        }}
                      />
                      <input
                        className={paperInputClass}
                        placeholder="Start YYYY-MM"
                        value={role.startDate ?? ""}
                        onChange={(e) => {
                          const next = [...draft.work];
                          next[ri] = {
                            ...role,
                            startDate: e.target.value || null,
                          };
                          patch({ work: next });
                        }}
                      />
                      <input
                        className={paperInputClass}
                        placeholder="End YYYY-MM or empty"
                        value={role.endDate ?? ""}
                        onChange={(e) => {
                          const next = [...draft.work];
                          next[ri] = {
                            ...role,
                            endDate: e.target.value || null,
                          };
                          patch({ work: next });
                        }}
                      />
                      <input
                        className={`${paperInputClass} sm:col-span-2`}
                        placeholder="Location"
                        value={role.location ?? ""}
                        onChange={(e) => {
                          const next = [...draft.work];
                          next[ri] = {
                            ...role,
                            location: e.target.value || null,
                          };
                          patch({ work: next });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">
                          Highlights
                        </span>
                        <IconBtn
                          label="Add highlight"
                          onClick={() => {
                            const next = [...draft.work];
                            next[ri] = {
                              ...role,
                              highlights: [...role.highlights, ""],
                            };
                            patch({ work: next });
                          }}
                        >
                          <Plus className="size-3.5" weight="bold" />
                        </IconBtn>
                      </div>
                      {role.highlights.map((h, hi) => (
                        <div key={`h-${ri}-${hi}`} className="flex gap-2">
                          <textarea
                            className={`${paperInputClass} min-h-[2.5rem] resize-y`}
                            value={h}
                            onChange={(e) => {
                              const next = [...draft.work];
                              const highlights = [...role.highlights];
                              highlights[hi] = e.target.value;
                              next[ri] = { ...role, highlights };
                              patch({ work: next });
                            }}
                          />
                          <IconBtn
                            label="Remove highlight"
                            danger
                            onClick={() => {
                              const next = [...draft.work];
                              next[ri] = {
                                ...role,
                                highlights: role.highlights.filter(
                                  (_, j) => j !== hi,
                                ),
                              };
                              patch({ work: next });
                            }}
                          >
                            <Trash className="size-3.5" weight="bold" />
                          </IconBtn>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-foreground">
                      {role.position} · {role.name}
                    </p>
                    <p className="text-xs">
                      {role.startDate ?? "?"} — {role.endDate ?? "Present"}
                      {role.location ? ` · ${role.location}` : ""}
                    </p>
                    {role.highlights.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {role.highlights.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={onShowAllWork}
              className="mt-3 text-sm font-medium text-guava-green underline-offset-2 hover:underline"
            >
              Show all ({hiddenCount} more)
            </button>
          ) : null}
        </Section>
      )}

      {(editing || data.education.length > 0) && (
        <Section
          title="Education"
          actions={
            editing ? (
              <IconBtn
                label="Add education"
                onClick={() =>
                  patch({
                    education: [
                      ...draft!.education,
                      {
                        institution: "",
                        studyType: null,
                        area: null,
                        startDate: null,
                        endDate: null,
                      },
                    ],
                  })
                }
              >
                <Plus className="size-3.5" weight="bold" />
              </IconBtn>
            ) : null
          }
        >
          {editing && draft ? (
            <ul className="space-y-3">
              {draft.education.map((ed, i) => (
                <li
                  key={`ed-${i}`}
                  className="space-y-2 rounded-xl border border-guava-green/15 p-3"
                >
                  <div className="flex justify-end">
                    <IconBtn
                      label="Remove"
                      danger
                      onClick={() =>
                        patch({
                          education: draft.education.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash className="size-3.5" weight="bold" />
                    </IconBtn>
                  </div>
                  <input
                    className={paperInputClass}
                    placeholder="Institution"
                    value={ed.institution}
                    onChange={(e) => {
                      const next = [...draft.education];
                      next[i] = { ...ed, institution: e.target.value };
                      patch({ education: next });
                    }}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className={paperInputClass}
                      placeholder="Degree / study type"
                      value={ed.studyType ?? ""}
                      onChange={(e) => {
                        const next = [...draft.education];
                        next[i] = {
                          ...ed,
                          studyType: e.target.value || null,
                        };
                        patch({ education: next });
                      }}
                    />
                    <input
                      className={paperInputClass}
                      placeholder="Area"
                      value={ed.area ?? ""}
                      onChange={(e) => {
                        const next = [...draft.education];
                        next[i] = { ...ed, area: e.target.value || null };
                        patch({ education: next });
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {data.education.map((ed) => (
                <li key={`${ed.institution}-${ed.area}`}>
                  <p className="font-medium text-foreground">
                    {ed.institution}
                  </p>
                  <p className="text-xs">
                    {[ed.studyType, ed.area].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {(editing || data.skills.length > 0) && (
        <Section
          title="Skills"
          actions={
            editing ? (
              <IconBtn
                label="Add skill"
                onClick={() =>
                  patch({
                    skills: [...draft!.skills, { name: "" }],
                  })
                }
              >
                <Plus className="size-3.5" weight="bold" />
              </IconBtn>
            ) : null
          }
        >
          {editing && draft ? (
            <ul className="space-y-2">
              {draft.skills.map((skill, i) => (
                <li key={`sk-${i}`} className="flex gap-2">
                  <input
                    className={paperInputClass}
                    value={skill.name}
                    onChange={(e) => {
                      const next = [...draft.skills];
                      next[i] = { ...skill, name: e.target.value };
                      patch({ skills: next });
                    }}
                  />
                  <IconBtn
                    label="Remove"
                    danger
                    onClick={() =>
                      patch({
                        skills: draft.skills.filter((_, j) => j !== i),
                      })
                    }
                  >
                    <Trash className="size-3.5" weight="bold" />
                  </IconBtn>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <li
                  key={skill.name}
                  className="rounded-full border border-guava-green/20 px-2.5 py-1 text-xs"
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
    </div>
  );
}

export function CvChoiceToggle({
  cvChoice,
  hasGenerated,
  busy,
  onCvChoiceChange,
}: {
  cvChoice: "UPLOADED" | "GENERATED";
  hasGenerated: boolean;
  busy?: boolean;
  onCvChoiceChange: (choice: "UPLOADED" | "GENERATED") => void;
}) {
  return (
    <div
      className="inline-flex w-full rounded-xl border border-guava-green/20 bg-white p-1"
      role="group"
      aria-label="CV source"
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => onCvChoiceChange("UPLOADED")}
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          cvChoice === "UPLOADED"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <FileText className="size-3.5" weight="duotone" />
        Uploaded
      </button>
      <button
        type="button"
        disabled={busy || !hasGenerated}
        onClick={() => onCvChoiceChange("GENERATED")}
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
          cvChoice === "GENERATED"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title={!hasGenerated ? "Generate a tailored CV first" : undefined}
      >
        <BracketsCurly className="size-3.5" weight="duotone" />
        Generated
      </button>
    </div>
  );
}

export function GenerateTailoredCvButton({
  app,
  className = "",
}: {
  app: ApplicationResponse;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingCv, setAwaitingCv] = useState(false);
  /** Snapshot of generatedCv.updatedAt when generation started (null = none yet). */
  const cvBaselineRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const jd = effectiveJobDescription(app);
  const jdOk = jd.trim().length >= 50;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!awaitingCv) return;

    let cancelled = false;
    const baseline = cvBaselineRef.current;
    const CV_POLL_TIMEOUT_MS = 90_000;

    function stopAwaiting() {
      setAwaitingCv(false);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    async function pollOnce() {
      try {
        if (Date.now() - startedAtRef.current >= CV_POLL_TIMEOUT_MS) {
          if (!cancelled) {
            setError(
              "Tailored CV is taking longer than expected. Try again in a moment.",
            );
            stopAwaiting();
          }
          return;
        }

        const token = await getAccessToken();
        const fresh = await apiFetch<ApplicationResponse>(
          `/applications/${app.id}`,
          { token },
        );
        if (cancelled) return;

        queryClient.setQueryData(["application", app.id], fresh);

        const nextUpdated = fresh.generatedCv?.updatedAt ?? null;
        const ready =
          !!fresh.generatedCv?.content &&
          (baseline == null
            ? true
            : nextUpdated != null && nextUpdated !== baseline);

        if (ready) {
          stopAwaiting();
          return;
        }
      } catch {
        // Keep polling — transient network errors should not abort.
      }
    }

    void pollOnce();
    pollRef.current = setInterval(() => void pollOnce(), 2000);

    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [awaitingCv, app.id, queryClient]);

  const cvMutation = useMutation({
    mutationFn: async () => {
      if (!jdOk) {
        throw new ApiError(
          "Add a job description of at least 50 characters first.",
          { status: 400, code: "JD_TOO_SHORT" },
        );
      }
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(
        `/applications/${app.id}/generate-cv`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            pastedJobDescription: (app.pastedJobDescription ?? "").trim()
              ? app.pastedJobDescription
              : jd,
          }),
        },
      );
    },
    onSuccess: (data) => {
      setError(null);
      // Capture baseline before any poll so a re-generate waits for a new CV.
      cvBaselineRef.current = app.generatedCv?.updatedAt ?? null;
      startedAtRef.current = Date.now();
      queryClient.setQueryData(["application", app.id], data);
      track(AnalyticsEvents.generate_started, {
        applicationId: data.id,
        mode: "hybrid_generate_cv",
      });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      setAwaitingCv(true);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
        track(AnalyticsEvents.quota_hit, { source: "hybrid_generate_cv" });
        setQuotaOpen(true);
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not start CV generation.",
      );
    },
  });

  return (
    <>
      <button
        type="button"
        disabled={cvMutation.isPending || awaitingCv || !jdOk}
        onClick={() => cvMutation.mutate()}
        title={
          !jdOk
            ? "Paste a fuller job description (≥50 chars) first"
            : undefined
        }
        className={[
          "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-guava-pink/25 bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:border-guava-pink/45 disabled:opacity-50 active:scale-[0.98]",
          className,
        ].join(" ")}
      >
        {cvMutation.isPending || awaitingCv ? (
          <CircleNotch className="size-4 animate-spin" weight="bold" />
        ) : (
          <Sparkle className="size-4" weight="duotone" />
        )}
        {awaitingCv
          ? "Generating tailored CV…"
          : app.generatedCv?.content
            ? "Regenerate tailored CV"
            : "Generate tailored CV"}
      </button>
      {error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <QuotaSheet open={quotaOpen} onClose={() => setQuotaOpen(false)} />
    </>
  );
}

export function GeneratedCvPanel({
  app,
  compactEmpty,
  cvChoice,
  onCvChoiceChange,
  choiceBusy,
}: {
  app: ApplicationResponse;
  /** Hide the outer chrome when used inside a tab that already has a header */
  compactEmpty?: boolean;
  /** When set with onCvChoiceChange, shows uploaded/generated toggle (old layout). */
  cvChoice?: "UPLOADED" | "GENERATED";
  onCvChoiceChange?: (choice: "UPLOADED" | "GENERATED") => void;
  choiceBusy?: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<GeneratedCvContent | null>(null);
  const [showAllWork, setShowAllWork] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);
  const [jsonEditing, setJsonEditing] = useState(false);
  const [jsonDraft, setJsonDraft] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasGenerated = !!app.generatedCv?.content;
  const content = app.generatedCv?.content;
  const showChoice = !!cvChoice && !!onCvChoiceChange;
  const viewingUploaded = showChoice && cvChoice === "UPLOADED";
  const uploadedName =
    typeof app.cvSnapshot?.fileName === "string"
      ? app.cvSnapshot.fileName
      : "Uploaded CV";

  useEffect(() => {
    if (!editing) setDraft(null);
  }, [app.generatedCv?.updatedAt, editing]);

  useEffect(() => {
    if (!jsonEditing && content) {
      setJsonDraft(JSON.stringify(content, null, 2));
    }
  }, [app.generatedCv?.updatedAt, content, jsonEditing]);

  const saveMutation = useMutation({
    mutationFn: async (generatedCvContent: GeneratedCvContent) => {
      const token = await getAccessToken();
      return apiFetch<ApplicationResponse>(`/applications/${app.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ generatedCvContent }),
      });
    },
    onSuccess: (data) => {
      setSaveError(null);
      setJsonError(null);
      setEditing(false);
      setDraft(null);
      setJsonEditing(false);
      queryClient.setQueryData(
        ["application", app.id],
        (old: ApplicationResponse | undefined) => ({
          ...data,
          events: data.events ?? old?.events,
        }),
      );
    },
    onError: (err) => {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "Could not save CV. Try again.",
      );
    },
  });

  function startEdit() {
    if (!content) return;
    setJsonEditing(false);
    setJsonError(null);
    setDraft(cloneContent(content));
    setEditing(true);
    setShowAllWork(true);
    setSaveError(null);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
    setSaveError(null);
  }

  function startJsonEdit() {
    if (!content) return;
    setEditing(false);
    setDraft(null);
    setShowRawJson(true);
    setJsonDraft(JSON.stringify(content, null, 2));
    setJsonEditing(true);
    setJsonError(null);
    setSaveError(null);
  }

  function cancelJsonEdit() {
    setJsonEditing(false);
    setJsonError(null);
    if (content) setJsonDraft(JSON.stringify(content, null, 2));
  }

  function saveJsonEdit() {
    try {
      const parsed: unknown = JSON.parse(jsonDraft);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        setJsonError("JSON must be a single object.");
        return;
      }
      const obj = parsed as Record<string, unknown>;
      // Identity is hydrated at read time — never persist basics/PII keys.
      const identityKeys = [
        "basics",
        "name",
        "fullName",
        "firstName",
        "lastName",
        "email",
        "phone",
        "telephone",
        "mobile",
        "profiles",
        "linkedinUrl",
        "address",
        "url",
      ];
      for (const key of identityKeys) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          setJsonError(
            `Remove "${key}" — stored CV JSON must stay anonymous (no identity fields).`,
          );
          return;
        }
      }
      setJsonError(null);
      saveMutation.mutate(parsed as GeneratedCvContent);
    } catch {
      setJsonError("Invalid JSON — fix syntax before saving. Nothing was written.");
    }
  }

  if (!hasGenerated || !content) {
    return (
      <div className={compactEmpty ? "py-2" : undefined}>
        {!compactEmpty ? (
          <PaperPanel className="border-guava-green/20 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  {showChoice ? "CV for apply" : "No tailored CV yet"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {showChoice
                    ? "Choose the uploaded file or generate a job-tailored JSON CV."
                    : "Generate one from the saved job description. This uses one AI credit on success."}
                </p>
              </div>
              {showChoice ? (
                <div className="w-full max-w-xs sm:w-56">
                  <CvChoiceToggle
                    cvChoice={cvChoice!}
                    hasGenerated={false}
                    busy={choiceBusy}
                    onCvChoiceChange={onCvChoiceChange!}
                  />
                </div>
              ) : null}
            </div>
            {showChoice && viewingUploaded ? (
              <div className="mt-4 rounded-xl border border-guava-green/15 bg-guava-green/5 p-4 text-sm">
                <p className="font-medium text-foreground">{uploadedName}</p>
                <p className="mt-1 text-muted-foreground">
                  Your original uploaded CV snapshot attached to this
                  application.
                </p>
              </div>
            ) : null}
            <div className="mt-4">
              <GenerateTailoredCvButton app={app} />
            </div>
          </PaperPanel>
        ) : (
          <div className="space-y-3">
            {showChoice ? (
              <CvChoiceToggle
                cvChoice={cvChoice!}
                hasGenerated={false}
                busy={choiceBusy}
                onCvChoiceChange={onCvChoiceChange!}
              />
            ) : null}
            <p className="text-sm text-muted-foreground">
              No tailored CV yet. Generate one from the job description — uses
              one credit on success.
            </p>
            <GenerateTailoredCvButton app={app} />
          </div>
        )}
      </div>
    );
  }

  const tailoredBody = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {showChoice ? "CV for apply" : "Tailored CV"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {app.generatedCv?.edited || editing || jsonEditing
              ? "Edited by you — keep facts honest"
              : showChoice
                ? "Choose the uploaded file or the job-tailored JSON CV for downloads."
                : "Anonymous JSON CV tailored to this role"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showChoice ? (
            <div className="w-full max-w-xs sm:w-56">
              <CvChoiceToggle
                cvChoice={cvChoice!}
                hasGenerated
                busy={choiceBusy}
                onCvChoiceChange={onCvChoiceChange!}
              />
            </div>
          ) : null}
          {!viewingUploaded ? (
            editing || jsonEditing ? (
              <>
                <IconBtn
                  label="Save"
                  disabled={
                    saveMutation.isPending ||
                    (editing && !draft) ||
                    (jsonEditing && !jsonDraft.trim())
                  }
                  onClick={() => {
                    if (jsonEditing) saveJsonEdit();
                    else if (draft) saveMutation.mutate(draft);
                  }}
                >
                  {saveMutation.isPending ? (
                    <CircleNotch
                      className="size-3.5 animate-spin"
                      weight="bold"
                    />
                  ) : (
                    <Check className="size-3.5" weight="bold" />
                  )}
                </IconBtn>
                <IconBtn
                  label="Cancel"
                  disabled={saveMutation.isPending}
                  onClick={() => {
                    if (jsonEditing) cancelJsonEdit();
                    else cancelEdit();
                  }}
                >
                  <X className="size-3.5" weight="bold" />
                </IconBtn>
              </>
            ) : (
              <>
                <IconBtn label="Edit CV" onClick={startEdit}>
                  <PencilSimple className="size-3.5" weight="bold" />
                </IconBtn>
                <IconBtn label="Edit JSON" onClick={startJsonEdit}>
                  <BracketsCurly className="size-3.5" weight="bold" />
                </IconBtn>
              </>
            )
          ) : null}
        </div>
      </div>

      {saveError ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}

      {viewingUploaded ? (
        <div className="mt-4 rounded-xl border border-guava-green/15 bg-guava-green/5 p-4 text-sm">
          <p className="font-medium text-foreground">{uploadedName}</p>
          <p className="mt-1 text-muted-foreground">
            Your original uploaded CV snapshot attached to this application.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <StructuredCvView
              content={content}
              editing={editing}
              draft={draft}
              onChange={setDraft}
              showAllWork={showAllWork}
              onShowAllWork={() => setShowAllWork(true)}
            />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRawJson((v) => !v);
                  if (jsonEditing) cancelJsonEdit();
                }}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                {showRawJson || jsonEditing ? "Hide JSON" : "Show JSON"}
              </button>
              {!editing && !jsonEditing ? (
                <button
                  type="button"
                  onClick={startJsonEdit}
                  className="text-xs font-medium text-guava-green underline-offset-2 hover:underline"
                >
                  Edit JSON
                </button>
              ) : null}
            </div>

            {jsonEditing ? (
              <div className="space-y-2">
                <textarea
                  className={`${paperInputClass} min-h-[16rem] resize-y font-mono text-xs leading-relaxed`}
                  value={jsonDraft}
                  onChange={(e) => {
                    setJsonDraft(e.target.value);
                    if (jsonError) setJsonError(null);
                  }}
                  spellCheck={false}
                  aria-label="Generated CV JSON"
                />
                {jsonError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {jsonError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Edits save via PATCH with generatedCvContent. Invalid JSON
                    is not written.
                  </p>
                )}
              </div>
            ) : showRawJson ? (
              <pre className="max-h-96 overflow-auto rounded-xl border border-guava-green/15 bg-muted/30 p-4 text-xs leading-relaxed">
                {JSON.stringify(content, null, 2)}
              </pre>
            ) : null}
          </div>
        </>
      )}
    </>
  );

  return (
    <PaperPanel className="border-guava-green/20 p-5 md:p-6">
      {tailoredBody}
    </PaperPanel>
  );
}

/** Uploaded CV snapshot blurb for rail / tab context */
export function UploadedCvSummary({ app }: { app: ApplicationResponse }) {
  const uploadedName =
    typeof app.cvSnapshot?.fileName === "string"
      ? app.cvSnapshot.fileName
      : "Uploaded CV";

  return (
    <div className="rounded-xl border border-guava-green/15 bg-guava-green/5 p-4 text-sm">
      <p className="font-medium text-foreground">{uploadedName}</p>
      <p className="mt-1 text-muted-foreground">
        Your original uploaded CV snapshot for this application.
      </p>
    </div>
  );
}
