import { ProfileAtsGenerator } from '../ai/profile-ats.generator';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileAtsAssessmentResponse } from '../shared/schemas/assessment.schema';
export declare class ProfileAtsService {
    private readonly prisma;
    private readonly generator;
    constructor(prisma: PrismaService, generator: ProfileAtsGenerator);
    runAssessment(userId: string, profileId: string): Promise<ProfileAtsAssessmentResponse>;
    getForProfile(profileId: string): Promise<ProfileAtsAssessmentResponse | null>;
    private toResponse;
    private jsonStringArray;
    private jsonNumberRecord;
}
