import { UserTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsageService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUsageSnapshot(tier: UserTier, aiGenerationsUsedPeriod: number, usagePeriodStart: Date | null): {
        tier: import(".prisma/client").$Enums.UserTier;
        aiGenerationsUsedPeriod: number;
        aiGenerationsLimit: number | null;
        usagePeriodStart: Date | null;
    };
    assertCanGenerateAi(userId: string): Promise<void>;
    incrementAiUsage(userId: string): Promise<void>;
    private rolloverIfNeeded;
}
