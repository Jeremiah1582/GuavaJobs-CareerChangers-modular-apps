/** Minimum words in "What you did" before Improve with AI is offered. */
export const IMPROVE_WORD_MIN = 10;

export type GapFormFields = {
  role: string;
  dates: string;
  details: string;
  outcome: string;
};

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/** Deterministic plain-text answer for POST …/gaps/address. */
export function composeGapAnswer(fields: GapFormFields): string {
  const lines: string[] = [];
  const role = fields.role.trim();
  const dates = fields.dates.trim();
  const details = fields.details.trim();
  const outcome = fields.outcome.trim();
  if (role) lines.push(`Role: ${role}`);
  if (dates) lines.push(`Dates: ${dates}`);
  if (details) lines.push(`Details: ${details}`);
  if (outcome) lines.push(`Outcome: ${outcome}`);
  return lines.join("\n");
}

/** Parse a saved Role:/Dates:/Details:/Outcome: answer, or treat whole string as Details. */
export function parseGapAnswer(answer: string): GapFormFields {
  const empty: GapFormFields = {
    role: "",
    dates: "",
    details: "",
    outcome: "",
  };
  const trimmed = answer.trim();
  if (!trimmed) return empty;

  const hasLabels =
    /^Role:/m.test(trimmed) ||
    /^Dates:/m.test(trimmed) ||
    /^Details:/m.test(trimmed) ||
    /^Outcome:/m.test(trimmed);

  if (!hasLabels) {
    return { ...empty, details: trimmed };
  }

  const fields = { ...empty };
  let current: keyof GapFormFields | null = null;
  const buckets: Record<keyof GapFormFields, string[]> = {
    role: [],
    dates: [],
    details: [],
    outcome: [],
  };

  for (const line of trimmed.split("\n")) {
    const roleMatch = /^Role:\s*(.*)$/i.exec(line);
    const datesMatch = /^Dates:\s*(.*)$/i.exec(line);
    const detailsMatch = /^Details:\s*(.*)$/i.exec(line);
    const outcomeMatch = /^Outcome:\s*(.*)$/i.exec(line);
    if (roleMatch) {
      current = "role";
      buckets.role.push(roleMatch[1] ?? "");
      continue;
    }
    if (datesMatch) {
      current = "dates";
      buckets.dates.push(datesMatch[1] ?? "");
      continue;
    }
    if (detailsMatch) {
      current = "details";
      buckets.details.push(detailsMatch[1] ?? "");
      continue;
    }
    if (outcomeMatch) {
      current = "outcome";
      buckets.outcome.push(outcomeMatch[1] ?? "");
      continue;
    }
    if (current) {
      buckets[current].push(line);
    }
  }

  fields.role = buckets.role.join("\n").trim();
  fields.dates = buckets.dates.join("\n").trim();
  fields.details = buckets.details.join("\n").trim();
  fields.outcome = buckets.outcome.join("\n").trim();
  return fields;
}
