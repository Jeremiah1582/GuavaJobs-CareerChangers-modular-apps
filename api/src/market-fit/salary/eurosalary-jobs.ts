/**
 * Maps common role titles to EuroSalary.eu job slugs (kebab-case).
 * Unknown titles fall back to closest category or null.
 */
export const EUROSALARY_JOB_SLUGS = [
  'software-engineer',
  'data-scientist',
  'data-analyst',
  'product-manager',
  'project-manager',
  'devops-engineer',
  'ux-designer',
  'ui-designer',
  'marketing-manager',
  'sales-manager',
  'account-manager',
  'business-analyst',
  'hr-manager',
  'financial-analyst',
  'accountant',
  'customer-success-manager',
  'qa-engineer',
  'solutions-architect',
  'system-administrator',
  'content-writer',
  'operations-manager',
] as const;

export type EuroSalaryJobSlug = (typeof EUROSALARY_JOB_SLUGS)[number];

const TITLE_TO_SLUG: Array<{ pattern: RegExp; slug: EuroSalaryJobSlug }> = [
  { pattern: /solutions?\s*architect|enterprise\s*architect/i, slug: 'solutions-architect' },
  { pattern: /software\s*engineer|software\s*developer|full[\s-]?stack|backend|frontend/i, slug: 'software-engineer' },
  { pattern: /devops|site\s*reliability|sre|platform\s*engineer|cloud\s*engineer/i, slug: 'devops-engineer' },
  { pattern: /data\s*scientist/i, slug: 'data-scientist' },
  { pattern: /data\s*analyst|bi\s*analyst|business\s*intelligence/i, slug: 'data-analyst' },
  { pattern: /product\s*manager|product\s*owner/i, slug: 'product-manager' },
  { pattern: /project\s*manager|programme\s*manager|delivery\s*manager/i, slug: 'project-manager' },
  { pattern: /ux|product\s*designer|interaction\s*designer/i, slug: 'ux-designer' },
  { pattern: /ui\s*designer/i, slug: 'ui-designer' },
  { pattern: /marketing/i, slug: 'marketing-manager' },
  { pattern: /sales\s*manager|account\s*executive|business\s*development/i, slug: 'sales-manager' },
  { pattern: /account\s*manager|customer\s*success/i, slug: 'account-manager' },
  { pattern: /business\s*analyst/i, slug: 'business-analyst' },
  { pattern: /\bhr\b|people\s*partner|talent|recruiter/i, slug: 'hr-manager' },
  { pattern: /financial\s*analyst|fp&a/i, slug: 'financial-analyst' },
  { pattern: /accountant/i, slug: 'accountant' },
  { pattern: /qa\s*engineer|quality\s*assurance|test\s*engineer/i, slug: 'qa-engineer' },
  { pattern: /sysadmin|system\s*administrator|it\s*support/i, slug: 'system-administrator' },
  { pattern: /content\s*writer|copywriter|technical\s*writer/i, slug: 'content-writer' },
  { pattern: /operations\s*manager|ops\s*manager/i, slug: 'operations-manager' },
];

export function titleToEuroSalarySlug(title: string): EuroSalaryJobSlug | null {
  for (const row of TITLE_TO_SLUG) {
    if (row.pattern.test(title)) return row.slug;
  }
  return null;
}

/** Countries EuroSalary documents as supported (ISO-2 lowercase). */
export const EUROSALARY_COUNTRIES = new Set([
  'de',
  'fr',
  'es',
  'nl',
  'be',
  'at',
  'ch',
  'lu',
  'ie',
  'pt',
  'it',
  'pl',
  'cz',
  'se',
  'dk',
  'fi',
]);
