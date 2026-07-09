import { z } from 'zod';

export const applicationEventTypeSchema = z.enum([
  'RESPONSE',
  'INTERVIEW',
  'NOTE',
  'NEXT_STEP',
  'STATUS_CHANGE',
]);

export const createApplicationEventSchema = z.object({
  eventType: applicationEventTypeSchema,
  occurredAt: z.string().datetime(),
  content: z.string().min(1).max(10_000),
  contactName: z.string().max(200).optional(),
});

export const patchApplicationEventSchema = createApplicationEventSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const listEventsQuerySchema = z.object({
  eventType: applicationEventTypeSchema.optional(),
});

export type CreateApplicationEventInput = z.infer<
  typeof createApplicationEventSchema
>;
export type PatchApplicationEventInput = z.infer<
  typeof patchApplicationEventSchema
>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
