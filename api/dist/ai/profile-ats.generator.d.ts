import { Profile, ProfileIndustry } from '@prisma/client';
import { LlmClient } from './llm.client';
import { ProfileAtsLlmOutput } from '../shared/schemas/assessment.schema';
export declare class ProfileAtsGenerator {
    private readonly llm;
    constructor(llm: LlmClient);
    buildInputFingerprint(profile: Pick<Profile, 'profileTitle' | 'jobTitle' | 'seniority' | 'primaryIndustry' | 'skills' | 'summary'>, parsedCvText: string): string;
    generate(params: {
        profile: Profile;
        parsedCvText: string;
    }): Promise<ProfileAtsLlmOutput & {
        inputFingerprint: string;
    }>;
}
export declare function isPrimaryIndustrySet(industry: ProfileIndustry | null | undefined): industry is ProfileIndustry;
