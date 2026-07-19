import { Injectable } from '@nestjs/common';
import { Prisma, Profile, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import {
  mergePreferencesIntoMetadata,
  PatchMeInput,
  preferencesFromMetadata,
  UserResponse,
} from '../shared/schemas/user.schema';
import { UsageService } from './usage.service';

type UserWithDefaultProfile = User & {
  profiles: Pick<
    Profile,
    'id' | 'profileTitle' | 'jobTitle' | 'isDefault'
  >[];
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profiles: {
          where: { isDefault: true },
          take: 1,
          select: {
            id: true,
            profileTitle: true,
            jobTitle: true,
            isDefault: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    return this.toUserResponse(user);
  }

  async patchMe(userId: string, input: PatchMeInput): Promise<UserResponse> {
    const { preferences, ...scalars } = input;

    if (preferences !== undefined) {
      const current = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { metadata: true },
      });
      if (!current) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...scalars,
          metadata: mergePreferencesIntoMetadata(
            current.metadata,
            preferences,
          ) as Prisma.InputJsonValue,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: scalars,
      });
    }

    return this.getMe(userId);
  }

  private toUserResponse(user: UserWithDefaultProfile): UserResponse {
    const defaultProfile = user.profiles[0] ?? null;
    const usage = this.usage.getUsageSnapshot(
      user.tier,
      user.aiGenerationsUsedPeriod,
      user.usagePeriodStart,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      imgUrl: user.imgUrl,
      linkedinUrl: user.linkedinUrl,
      githubUrl: user.githubUrl,
      tier: user.tier,
      defaultProfileId: defaultProfile?.id ?? null,
      defaultProfile: defaultProfile
        ? {
            id: defaultProfile.id,
            profileTitle: defaultProfile.profileTitle,
            jobTitle: defaultProfile.jobTitle,
            isDefault: defaultProfile.isDefault,
          }
        : null,
      usage: {
        tier: usage.tier,
        aiGenerationsUsedPeriod: usage.aiGenerationsUsedPeriod,
        aiGenerationsLimit: usage.aiGenerationsLimit,
        usagePeriodStart: usage.usagePeriodStart?.toISOString() ?? null,
      },
      preferences: preferencesFromMetadata(user.metadata),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
