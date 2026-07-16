/** Cookie set when onboarding finishes — read by middleware. */
export const ONBOARDING_COOKIE = "gj_onboarding_complete";

export const PROFILE_INDUSTRIES = [
  "SOFTWARE",
  "SALES",
  "DATA_ANALYSIS",
  "FINANCE",
  "HR",
  "MARKETING",
  "OPERATIONS",
  "PRODUCT",
  "DESIGN",
  "OTHER",
] as const;

export type ProfileIndustry = (typeof PROFILE_INDUSTRIES)[number];

export const SENIORITY_LEVELS = [
  "INTERN",
  "JUNIOR",
  "MID",
  "SENIOR",
  "LEAD",
  "EXECUTIVE",
  "C_LEVEL",
] as const;

export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];

export const INDUSTRY_LABELS: Record<ProfileIndustry, string> = {
  SOFTWARE: "Software",
  SALES: "Sales",
  DATA_ANALYSIS: "Data analysis",
  FINANCE: "Finance",
  HR: "HR",
  MARKETING: "Marketing",
  OPERATIONS: "Operations",
  PRODUCT: "Product",
  DESIGN: "Design",
  OTHER: "Other",
};

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  INTERN: "Intern",
  JUNIOR: "Junior",
  MID: "Mid",
  SENIOR: "Senior",
  LEAD: "Lead",
  EXECUTIVE: "Executive",
  C_LEVEL: "C-level",
};

export type OnboardingStep = "name" | "industry" | "cv" | "ats";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "name",
  "industry",
  "cv",
  "ats",
];

export const STEP_LABELS: Record<OnboardingStep, string> = {
  name: "Your name",
  industry: "Target role",
  cv: "Upload CV",
  ats: "CV health",
};

export function markOnboardingComplete(): void {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${ONBOARDING_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
