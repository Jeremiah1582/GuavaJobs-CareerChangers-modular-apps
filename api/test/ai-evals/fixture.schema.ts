import { z } from 'zod';

export const aiEvalFixtureSchema = z.object({
  id: z.string().min(1),
  industry: z.enum([
    'SOFTWARE',
    'SALES',
    'DATA_ANALYSIS',
    'FINANCE',
    'HR',
    'MARKETING',
    'OPERATIONS',
    'PRODUCT',
    'DESIGN',
    'OTHER',
  ]),
  profile: z.object({
    jobTitle: z.string().min(1),
    summary: z.string().min(1),
    skills: z.array(z.string()).min(1),
  }),
  jobTitle: z.string().min(1),
  companyName: z.string().min(1),
  jobDescription: z.string().min(80),
  cvText: z.string().min(80),
  /** Plausible employers NOT in cvText — must not appear in generated letter. */
  forbiddenEmployers: z.array(z.string().min(2)).min(1),
  /** Plausible degrees NOT in cvText — must not appear in generated letter. */
  forbiddenDegrees: z.array(z.string().min(2)).min(1),
  /** Honest cover letter grounded only in cvText (for ATS eval isolation). */
  baselineCoverLetter: z.string().min(50),
  atsScoreMin: z.number().int().min(0).max(100),
  atsScoreMax: z.number().int().min(0).max(100),
});

export type AiEvalFixture = z.infer<typeof aiEvalFixtureSchema>;
