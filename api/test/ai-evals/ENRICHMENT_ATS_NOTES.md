created_date: 2026-07-20 16:25:00, updated_at: 2026-07-20 16:25:00

# AI eval notes — enrichment-aware job ATS

Manual / future fixture guidance (live evals still gated by `RUN_AI_EVALS=true`).

## Expectations

1. **Weak-fit fixtures** (e.g. software CV vs trades JD) must still land in a low band after calibration — enrichments must not invent domain evidence.
2. **After enrichment:** when `careerEnrichments` include a ≥10-word answer that clearly covers a prior keyword gap, the refreshed report should:
   - Drop or soften that gap bullet
   - Not collapse overall fit solely because gap *count* dropped then rose in wording
   - Prefer an improved or stable `score` vs punishing honest fills
3. **`gapsDetailed`:** kinds should align with narrative (`domain` for wrong-field, `cert` for licenses, etc.); `gaps: string[]` remains populated for compat.
4. **`changeSummary`:** present on refresh when a previous report exists; absent or null on first generate.

Unit coverage lives in `ats-score-calibrate.spec.ts` and `jd-must-haves.spec.ts` (no live LLM required).
