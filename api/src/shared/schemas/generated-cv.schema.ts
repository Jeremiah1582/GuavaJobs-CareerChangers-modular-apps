import { z } from 'zod';

/** Identity keys must never appear in stored GeneratedCv.content (GDPR split). */
export const FORBIDDEN_STORED_IDENTITY_KEYS = [
  'basics',
  'name',
  'fullName',
  'firstName',
  'lastName',
  'email',
  'phone',
  'telephone',
  'mobile',
  'contactPhone',
  'address',
  'street',
  'url',
  'profiles',
  'linkedinUrl',
  'githubUrl',
  'imgUrl',
] as const;

const dateYmOrYmd = z
  .string()
  .regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Expected YYYY-MM or YYYY-MM-DD');

const workItemSchema = z.object({
  name: z.string().min(1).max(200),
  position: z.string().min(1).max(200),
  location: z.string().max(200).nullable().optional(),
  startDate: dateYmOrYmd,
  endDate: dateYmOrYmd.nullable(),
  highlights: z.array(z.string().min(1).max(500)).max(12).default([]),
});

const educationItemSchema = z.object({
  institution: z.string().min(1).max(200),
  area: z.string().max(200).nullable().optional(),
  studyType: z.string().max(200).nullable().optional(),
  startDate: dateYmOrYmd.nullable().optional(),
  endDate: dateYmOrYmd.nullable().optional(),
});

const skillItemSchema = z.object({
  name: z.string().min(1).max(100),
  keywords: z.array(z.string().min(1).max(80)).max(20).optional(),
});

const certificateItemSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().max(200).nullable().optional(),
  date: dateYmOrYmd.nullable().optional(),
  expiryDate: dateYmOrYmd.nullable().optional(),
});

const projectItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  highlights: z.array(z.string().min(1).max(500)).max(10).optional(),
  startDate: dateYmOrYmd.nullable().optional(),
  endDate: dateYmOrYmd.nullable().optional(),
  url: z.string().url().nullable().optional(),
});

const languageItemSchema = z.object({
  language: z.string().min(1).max(100),
  fluency: z.string().max(100).nullable().optional(),
});

const awardItemSchema = z.object({
  title: z.string().min(1).max(200),
  date: dateYmOrYmd.nullable().optional(),
  awarder: z.string().max(200).nullable().optional(),
  summary: z.string().max(1000).nullable().optional(),
});

const volunteerItemSchema = z.object({
  organization: z.string().min(1).max(200),
  position: z.string().max(200).nullable().optional(),
  startDate: dateYmOrYmd.nullable().optional(),
  endDate: dateYmOrYmd.nullable().optional(),
  summary: z.string().max(1000).nullable().optional(),
  highlights: z.array(z.string().min(1).max(500)).max(10).optional(),
});

const generatedCvMetaSchema = z.object({
  schemaVersion: z.string().min(1).max(32).default('json-ats-v1'),
  /** Human-readable target, e.g. "Software Engineer @ Acme". */
  tailoredFor: z.string().max(400).optional(),
  generatedAt: z.string().datetime().optional(),
});

export function assertNoForbiddenStoredCvKeys(
  value: Record<string, unknown>,
): void {
  for (const key of FORBIDDEN_STORED_IDENTITY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      throw new Error(
        `Stored GeneratedCv content must not include identity key "${key}"`,
      );
    }
  }
}

function rejectIdentityKeys(
  value: Record<string, unknown>,
  ctx: z.RefinementCtx,
) {
  for (const key of FORBIDDEN_STORED_IDENTITY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Stored GeneratedCv content must not include identity key "${key}"`,
        path: [key],
      });
    }
  }
}

/** Anonymous career body persisted on GeneratedCv.content — never includes PII. */
const storedGeneratedCvContentObjectSchema = z.object({
  label: z.string().max(200).nullable().optional(),
  summary: z.string().max(4000).nullable().optional(),
  coreCompetencies: z.array(z.string().min(1).max(100)).max(30).default([]),
  work: z.array(workItemSchema).max(30).default([]),
  education: z.array(educationItemSchema).max(20).default([]),
  skills: z.array(skillItemSchema).max(40).default([]),
  certificates: z.array(certificateItemSchema).max(20).default([]),
  projects: z.array(projectItemSchema).max(20).default([]),
  languages: z.array(languageItemSchema).max(20).default([]),
  awards: z.array(awardItemSchema).max(20).default([]),
  volunteer: z.array(volunteerItemSchema).max(20).default([]),
  meta: generatedCvMetaSchema.optional(),
});

export const storedGeneratedCvContentSchema =
  storedGeneratedCvContentObjectSchema.strict().superRefine(rejectIdentityKeys);

export type StoredGeneratedCvContent = z.infer<
  typeof storedGeneratedCvContentSchema
>;

/** @deprecated Prefer storedGeneratedCvContentSchema */
export const generatedCvStoredContentSchema = storedGeneratedCvContentSchema;
/** @deprecated Prefer StoredGeneratedCvContent */
export type GeneratedCvStoredContent = StoredGeneratedCvContent;

/** Identity merged at read/download time from User + Profile — never written to DB. */
export const generatedCvBasicsSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  label: z.string().nullable(),
  location: z
    .object({
      city: z.string().nullable(),
      country: z.string().nullable(),
    })
    .optional(),
  profiles: z
    .array(
      z.object({
        network: z.string(),
        url: z.string().min(1).max(2000),
      }),
    )
    .default([]),
});

export type GeneratedCvBasics = z.infer<typeof generatedCvBasicsSchema>;

/**
 * Stored content + identity basics — used only at GET/download, never written to DB.
 * Built via `.extend` (not intersection) so `.strict()` does not reject `basics`.
 */
export const hydratedGeneratedCvExportSchema =
  storedGeneratedCvContentObjectSchema
    .extend({ basics: generatedCvBasicsSchema })
    .strict();

export type HydratedGeneratedCvExport = z.infer<
  typeof hydratedGeneratedCvExportSchema
>;

/** @deprecated Prefer hydratedGeneratedCvExportSchema */
export const generatedCvHydratedSchema = hydratedGeneratedCvExportSchema;
/** @deprecated Prefer HydratedGeneratedCvExport */
export type GeneratedCvHydrated = HydratedGeneratedCvExport;

export const generatedCvResponseSchema = z.object({
  id: z.string(),
  content: storedGeneratedCvContentSchema,
  edited: z.boolean(),
  templateId: z.string(),
  sourceCvDocumentId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type GeneratedCvResponse = z.infer<typeof generatedCvResponseSchema>;

export const applicationCvChoiceSchema = z.enum(['UPLOADED', 'GENERATED']);

export type ApplicationCvChoice = z.infer<typeof applicationCvChoiceSchema>;

/** Strip forbidden identity keys before Zod parse (LLM may echo them). */
export function stripIdentityFromStoredContent(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...raw };
  for (const key of FORBIDDEN_STORED_IDENTITY_KEYS) {
    delete out[key];
  }
  return out;
}

export function hydrateGeneratedCvContent(
  content: StoredGeneratedCvContent,
  basics: GeneratedCvBasics,
): HydratedGeneratedCvExport {
  return hydratedGeneratedCvExportSchema.parse({ ...content, basics });
}
