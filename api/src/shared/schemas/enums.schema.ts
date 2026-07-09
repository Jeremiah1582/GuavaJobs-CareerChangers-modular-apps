import { z } from 'zod';

export const profileIndustrySchema = z.enum([
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
]);

export const seniorityLevelSchema = z.enum([
  'INTERN',
  'JUNIOR',
  'MID',
  'SENIOR',
  'LEAD',
  'EXECUTIVE',
  'C_LEVEL',
]);

export const userTierSchema = z.enum(['FREE', 'PAID']);

export const salaryPeriodSchema = z.enum(['ANNUAL', 'MONTHLY', 'HOURLY']);

export type ProfileIndustry = z.infer<typeof profileIndustrySchema>;
export type SeniorityLevel = z.infer<typeof seniorityLevelSchema>;
export type UserTier = z.infer<typeof userTierSchema>;
export type SalaryPeriod = z.infer<typeof salaryPeriodSchema>;
