import { ProfileIndustry, SeniorityLevel } from '@prisma/client';
export type IndustryCriteria = {
    label: string;
    keywordFocus: string[];
    seniorityExpectations: Partial<Record<SeniorityLevel, string>>;
};
export declare const INDUSTRY_CRITERIA: Record<ProfileIndustry, IndustryCriteria>;
export declare function getIndustryCriteria(industry: ProfileIndustry): IndustryCriteria;
