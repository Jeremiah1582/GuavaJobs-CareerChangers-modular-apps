/** Subset of ATS LLM output needed for score calibration. */
export type AtsScoreCalibrateInput = {
  score: number;
  letterScore?: number;
  cvScore?: number;
  missingKeywords: string[];
  gaps: string[];
  strengths: string[];
  keywordCoverage: Record<string, number>;
};

/** Narrative signals that imply poor JD fit — used to cap inflated LLM scores. */
export function estimateFitSeverity(
  input: Pick<
    AtsScoreCalibrateInput,
    'missingKeywords' | 'gaps' | 'strengths' | 'keywordCoverage'
  >,
): number {
  const { missingKeywords, gaps, strengths, keywordCoverage } = input;
  let severity = 0;

  const missing = missingKeywords.length;
  if (missing >= 8) severity += 0.4;
  else if (missing >= 5) severity += 0.3;
  else if (missing >= 3) severity += 0.18;
  else if (missing >= 1) severity += 0.08;

  const gapCount = gaps.length;
  if (gapCount >= 4) severity += 0.32;
  else if (gapCount >= 2) severity += 0.22;
  else if (gapCount >= 1) severity += 0.1;

  const gapText = gaps.join(' ').toLowerCase();
  const domainMismatch =
    /\b(no experience|no relevant|wrong field|unrelated|does not match|doesn't match|not a fit|lack(?:s|ing)? (?:any )?(?:relevant |required )?(?:experience|background|qualification)|career change|different (?:industry|field|domain))\b/.test(
      gapText,
    );
  if (domainMismatch) severity += 0.25;

  if (strengths.length === 0) severity += 0.12;
  else if (strengths.length === 1 && gapCount >= 2) severity += 0.08;

  const coverageVals = Object.values(keywordCoverage);
  if (coverageVals.length >= 3) {
    const avg =
      coverageVals.reduce((a, b) => a + b, 0) / coverageVals.length;
    // keywordCoverage is normalized to 0–100
    if (avg < 25) severity += 0.22;
    else if (avg < 45) severity += 0.12;
  }

  return Math.min(1, severity);
}

function clampScore(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

/**
 * Cap LLM scores so they cannot contradict a harsh gaps/keywords narrative.
 * Also keeps letter/CV/overall in a sensible relative order for misfit cases.
 */
export function calibrateAtsScores<T extends AtsScoreCalibrateInput>(
  raw: T,
  opts?: { coverLetterLength?: number },
): T {
  const severity = estimateFitSeverity(raw);

  // Severe narrative → hard caps (software CV vs plumbing JD should land ~0–30).
  const maxOverall = clampScore(100 - severity * 85);
  const maxCv = clampScore(100 - severity * 90);
  // Letter may beat CV slightly when tailored/honest, but not escape domain reality.
  const maxLetter = clampScore(Math.min(100, maxOverall + 18));

  let score = clampScore(Math.min(raw.score, maxOverall));
  let cvScore =
    raw.cvScore === undefined
      ? undefined
      : clampScore(Math.min(raw.cvScore, maxCv));
  let letterScore =
    raw.letterScore === undefined
      ? undefined
      : clampScore(Math.min(raw.letterScore, maxLetter));

  // When narrative is harsh, prefer a CV-heavy blend over an optimistic overall.
  if (
    severity >= 0.35 &&
    cvScore !== undefined &&
    letterScore !== undefined
  ) {
    const blended = clampScore(0.55 * cvScore + 0.25 * letterScore + 0.2 * score);
    score = Math.min(score, blended, maxOverall);
  }

  const letterLen = opts?.coverLetterLength ?? 0;
  if (letterScore !== undefined && letterLen >= 120 && severity >= 0.35) {
    // Cover letter tailored from JD+CV should not be the worst score when fit is poor —
    // it is usually the least-bad document — but still capped by domain fit.
    const floor = clampScore(Math.min(maxLetter, Math.max(cvScore ?? 0, score) + 4));
    if (letterScore < floor) {
      letterScore = Math.min(maxLetter, floor);
    }
  }

  // Never let letter sit absurdly below overall when a real letter exists.
  if (
    letterScore !== undefined &&
    letterLen >= 120 &&
    letterScore < 8 &&
    score >= 8
  ) {
    letterScore = clampScore(Math.min(maxLetter, Math.max(12, Math.round(score * 0.7))));
  }

  return {
    ...raw,
    score,
    cvScore,
    letterScore,
  };
}
