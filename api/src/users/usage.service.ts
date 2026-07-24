import { Injectable } from '@nestjs/common';
import { PlatformRole, UserTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import { FREE_AI_GENERATIONS_PER_MONTH } from '../shared/constants/freemium.constants';

function hasUnlimitedAi(tier: UserTier, platformRole: PlatformRole): boolean {
  return (
    tier === UserTier.PAID ||
    platformRole === PlatformRole.ADMIN ||
    platformRole === PlatformRole.OWNER
  );
}

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  getUsageSnapshot(
    tier: UserTier,
    platformRole: PlatformRole,
    aiGenerationsUsedPeriod: number,
    usagePeriodStart: Date | null,
  ) {
    const unlimited = hasUnlimitedAi(tier, platformRole);
    const limit = unlimited ? null : FREE_AI_GENERATIONS_PER_MONTH;

    return {
      tier,
      aiGenerationsUsedPeriod,
      aiGenerationsLimit: limit,
      usagePeriodStart,
    };
  }

  async assertCanGenerateAi(userId: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const rolled = await this.rolloverIfNeeded(user.id, user.usagePeriodStart);

    if (hasUnlimitedAi(user.tier, user.platformRole)) {
      return;
    }

    if (rolled.aiGenerationsUsedPeriod >= FREE_AI_GENERATIONS_PER_MONTH) {
      throw new AppError(
        'QUOTA_EXCEEDED',
        `Free tier limit of ${FREE_AI_GENERATIONS_PER_MONTH} AI generations per month reached`,
        402,
      );
    }
  }

  async incrementAiUsage(userId: string): Promise<void> {
    await this.rolloverIfNeeded(userId, null);
    await this.prisma.user.update({
      where: { id: userId },
      data: { aiGenerationsUsedPeriod: { increment: 1 } },
    });
  }

  private async rolloverIfNeeded(
    userId: string,
    usagePeriodStart: Date | null,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const start = usagePeriodStart ?? user.usagePeriodStart;
    const now = new Date();

    if (!start || monthsElapsed(start, now) >= 1) {
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          aiGenerationsUsedPeriod: 0,
          usagePeriodStart: now,
        },
      });
    }

    return user;
  }
}

function monthsElapsed(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}
