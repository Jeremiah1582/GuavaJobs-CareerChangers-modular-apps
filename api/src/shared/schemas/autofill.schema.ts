import { z } from 'zod';
import { atsTypeSchema } from './job.schema';

export const autofillFieldBindingSchema = z.object({
  logicalKey: z.string(),
  selectors: z.array(z.string()).optional(),
  name: z.string().optional(),
  id: z.string().optional(),
  autocomplete: z.string().optional(),
  inputType: z
    .enum(['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'url'])
    .optional(),
});

export const atsFieldMapSchema = z.object({
  atsType: z.enum(['greenhouse', 'lever', 'ashby']),
  version: z.string(),
  fields: z.array(autofillFieldBindingSchema),
});

export const autofillValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const autofillPayloadSchema = z.object({
  applicationId: z.string(),
  profileId: z.string(),
  applyUrl: z.string().url().nullable(),
  atsType: atsTypeSchema,
  atsSupported: z.boolean(),
  fieldMap: atsFieldMapSchema.nullable(),
  values: z.record(autofillValueSchema),
  coverLetterContent: z.string().nullable(),
  cvStaging: z.object({
    hint: z.string(),
    downloadPath: z.string(),
  }),
  disclaimers: z.array(z.string()),
});

export const patchAutofillAnswersSchema = z
  .record(z.unknown())
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one autofill answer is required',
  });

export type AutofillFieldBinding = z.infer<typeof autofillFieldBindingSchema>;
export type AtsFieldMap = z.infer<typeof atsFieldMapSchema>;
export type AutofillPayload = z.infer<typeof autofillPayloadSchema>;
