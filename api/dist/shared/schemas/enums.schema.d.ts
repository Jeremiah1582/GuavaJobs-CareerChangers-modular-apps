import { z } from 'zod';
export declare const profileIndustrySchema: z.ZodEnum<["SOFTWARE", "SALES", "DATA_ANALYSIS", "FINANCE", "HR", "MARKETING", "OPERATIONS", "PRODUCT", "DESIGN", "OTHER"]>;
export declare const seniorityLevelSchema: z.ZodEnum<["INTERN", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE", "C_LEVEL"]>;
export declare const userTierSchema: z.ZodEnum<["FREE", "PAID"]>;
export declare const salaryPeriodSchema: z.ZodEnum<["ANNUAL", "MONTHLY", "HOURLY"]>;
export type ProfileIndustry = z.infer<typeof profileIndustrySchema>;
export type SeniorityLevel = z.infer<typeof seniorityLevelSchema>;
export type UserTier = z.infer<typeof userTierSchema>;
export type SalaryPeriod = z.infer<typeof salaryPeriodSchema>;
