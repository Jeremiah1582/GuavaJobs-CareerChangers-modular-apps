/**
 * Lightweight fixture checks for profile completeness (M4.5.2).
 * Run: node --experimental-strip-types scripts/check-profile-completeness.ts
 */
import {
  computeCompleteness,
  COMPLETENESS_SECTIONS,
} from "../src/lib/profile-completeness.ts";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const empty = computeCompleteness({});
assert(empty.percent === 0, `empty percent expected 0, got ${empty.percent}`);
assert(
  empty.missing.length === COMPLETENESS_SECTIONS.length,
  "empty should miss all sections",
);
assert(
  empty.softGateTip === "Add skills for stronger letters",
  `skills soft tip preferred, got ${empty.softGateTip}`,
);

const partial = computeCompleteness({
  jobTitle: "Product Manager",
  primaryIndustry: "SOFTWARE",
  seniority: "MID",
  skills: ["TypeScript"],
  locationCountry: "gb",
  currentCvId: "cv_1",
  parseStatus: "PENDING",
});
assert(partial.doneCount === 4, `partial doneCount expected 4, got ${partial.doneCount}`);
assert(
  partial.softGateTip === "Add skills for stronger letters",
  "skills still preferred soft tip when under 3",
);
assert(
  partial.missing.some((m) => m.id === "cv"),
  "PENDING cv should be missing",
);

const full = computeCompleteness({
  jobTitle: "Product Manager",
  primaryIndustry: "SOFTWARE",
  seniority: "MID",
  skills: ["TypeScript", "Stakeholder management", "SQL"],
  locationCity: "London",
  locationCountry: "gb",
  currentCvId: "cv_1",
  parseStatus: "READY",
});
assert(full.percent === 100, `full percent expected 100, got ${full.percent}`);
assert(full.softGateTip === null, "full profile has no soft tip");
assert(full.missing.length === 0, "full profile has no missing");

console.log("profile-completeness checks passed");
