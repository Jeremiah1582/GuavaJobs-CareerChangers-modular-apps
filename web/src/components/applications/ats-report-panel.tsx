"use client";

import type { ApplicationAtsReport } from "@/api/types";
import { PaperPanel } from "@/components/ui/paper-panel";

function ScoreRing({ score, label }: { score: number; label: string }) {
  const tone =
    score >= 70
      ? "text-guava-green"
      : score >= 45
        ? "text-foreground"
        : "text-guava-pink";

  return (
    <div className="text-center">
      <p className={`font-mono text-3xl font-semibold tracking-tight ${tone}`}>
        {score}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function BulletList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AtsReportPanel({ report }: { report: ApplicationAtsReport }) {
  return (
    <PaperPanel className="border-guava-green/20 p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">
          Fit &amp; ATS report
        </h2>
        <p className="text-xs text-muted-foreground">
          Based on your CV — we never invent employers or skills
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-b border-guava-green/10 pb-6">
        <ScoreRing score={report.score} label="Overall fit" />
        <ScoreRing
          score={report.letterScore ?? report.score}
          label="Letter"
        />
        <ScoreRing score={report.cvScore ?? report.score} label="CV keywords" />
      </div>

      <div className="mt-6 space-y-6">
        <BulletList
          title="Strengths"
          items={report.strengths}
          empty="No strengths listed for this package."
        />
        <BulletList
          title="Gaps"
          items={report.gaps}
          empty="No gaps called out — still review the letter before applying."
        />
        <BulletList
          title="Missing keywords"
          items={report.missingKeywords}
          empty="No keyword gaps flagged."
        />
        <BulletList
          title="What to do next"
          items={
            report.actionableSteps.length > 0
              ? report.actionableSteps
              : report.suggestions
          }
          empty="No next steps — polish the letter if anything feels off."
        />
      </div>
    </PaperPanel>
  );
}
