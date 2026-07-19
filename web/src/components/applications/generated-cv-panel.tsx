"use client";

import { useState } from "react";
import { BracketsCurly, FileText } from "@phosphor-icons/react";
import type { ApplicationResponse, GeneratedCvContent } from "@/api/types";
import { PaperPanel } from "@/components/ui/paper-panel";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function StructuredCvView({ content }: { content: GeneratedCvContent }) {
  return (
    <div className="space-y-5">
      <Section title="Target role">
        <p>{content.label ?? "—"}</p>
      </Section>
      {content.summary ? (
        <Section title="Summary">
          <p>{content.summary}</p>
        </Section>
      ) : null}
      {content.coreCompetencies.length > 0 ? (
        <Section title="Core competencies">
          <ul className="list-disc space-y-1 pl-5">
            {content.coreCompetencies.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      ) : null}
      {content.work.length > 0 ? (
        <Section title="Experience">
          <ul className="space-y-4">
            {content.work.map((role) => (
              <li key={`${role.name}-${role.position}-${role.startDate}`}>
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
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {content.skills.length > 0 ? (
        <Section title="Skills">
          <ul className="flex flex-wrap gap-2">
            {content.skills.map((skill) => (
              <li
                key={skill.name}
                className="rounded-full border border-guava-green/20 px-2.5 py-1 text-xs"
              >
                {skill.name}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

export function GeneratedCvPanel({
  app,
  cvChoice,
  onCvChoiceChange,
  busy,
}: {
  app: ApplicationResponse;
  cvChoice: "UPLOADED" | "GENERATED";
  onCvChoiceChange: (choice: "UPLOADED" | "GENERATED") => void;
  busy?: boolean;
}) {
  const [showRawJson, setShowRawJson] = useState(false);
  const uploadedName =
    typeof app.cvSnapshot?.fileName === "string"
      ? app.cvSnapshot.fileName
      : "Uploaded CV";
  const hasGenerated = !!app.generatedCv?.content;

  return (
    <PaperPanel className="border-guava-green/20 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">CV for apply</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the uploaded file or the job-tailored JSON CV for downloads.
          </p>
        </div>
        <div
          className="inline-flex rounded-xl border border-guava-green/20 bg-white p-1"
          role="group"
          aria-label="CV source"
        >
          <button
            type="button"
            disabled={busy}
            onClick={() => onCvChoiceChange("UPLOADED")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              cvChoice === "GENERATED"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={!hasGenerated ? "Generate a package first" : undefined}
          >
            <BracketsCurly className="size-3.5" weight="duotone" />
            Generated
          </button>
        </div>
      </div>

      {cvChoice === "UPLOADED" ? (
        <div className="mt-4 rounded-xl border border-guava-green/15 bg-guava-green/5 p-4 text-sm">
          <p className="font-medium text-foreground">{uploadedName}</p>
          <p className="mt-1 text-muted-foreground">
            Your original uploaded CV snapshot attached to this application.
          </p>
        </div>
      ) : hasGenerated ? (
        <div className="mt-4 space-y-4">
          <StructuredCvView content={app.generatedCv!.content} />
          <button
            type="button"
            onClick={() => setShowRawJson((v) => !v)}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            {showRawJson ? "Hide raw JSON" : "Show raw JSON"}
          </button>
          {showRawJson ? (
            <pre className="max-h-96 overflow-auto rounded-xl border border-guava-green/15 bg-muted/30 p-4 text-xs leading-relaxed">
              {JSON.stringify(app.generatedCvExport ?? app.generatedCv?.content, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No generated CV yet. Run generate or hybrid CV generation first.
        </p>
      )}
    </PaperPanel>
  );
}
