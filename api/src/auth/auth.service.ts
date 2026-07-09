import { Injectable } from '@nestjs/common';
import { ProfileIndustry, SeniorityLevel, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import { AuthenticatedUser, JwtClaims } from './auth.types';

const DEFAULT_PROFILE_TITLE = 'Default';
const DEFAULT_JOB_TITLE = 'Job Seeker';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  claimsToAuthUser(claims: JwtClaims): AuthenticatedUser {
    const email = claims.email;
    if (!email) {
      throw new AppError('UNAUTHORIZED', 'JWT missing email claim', 401);
    }
    const meta = claims.user_metadata ?? {};
    const name =
      meta.full_name?.trim() ||
      meta.name?.trim() ||
      email.split('@')[0] ||
      'User';

    return {
      id: claims.sub,
      email,
      name,
      imgUrl: meta.avatar_url ?? null,
    };
  }

  /** Upsert local User + ensure exactly one default Profile exists. */
  async syncUser(authUser: AuthenticatedUser): Promise<User> {
    const byId = await this.prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (byId) {
      const user = await this.prisma.user.update({
        where: { id: authUser.id },
        data: {
          email: authUser.email,
          name: authUser.name,
          ...(authUser.imgUrl !== null ? { imgUrl: authUser.imgUrl } : {}),
        },
      });
      await this.ensureDefaultProfile(user.id);
      return user;
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (byEmail) {
      const user = await this.rekeyUser(byEmail.id, authUser);
      await this.ensureDefaultProfile(user.id);
      return user;
    }

    const user = await this.prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        imgUrl: authUser.imgUrl,
      },
    });
    await this.ensureDefaultProfile(user.id);
    return user;
  }

  /** Seed/demo rows may use a placeholder id — re-key to the Supabase Auth UUID. */
  private async rekeyUser(
    oldId: string,
    authUser: AuthenticatedUser,
  ): Promise<User> {
    const old = await this.prisma.user.findUniqueOrThrow({
      where: { id: oldId },
    });

    return this.prisma.$transaction(async (tx) => {
      const tempEmail = `rekey-${authUser.id}@internal.guavajobs.local`;

      await tx.user.update({
        where: { id: oldId },
        data: { email: tempEmail },
      });

      const user = await tx.user.create({
        data: {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          imgUrl: authUser.imgUrl,
          tier: old.tier,
          aiGenerationsUsedPeriod: old.aiGenerationsUsedPeriod,
          usagePeriodStart: old.usagePeriodStart,
          linkedinUrl: old.linkedinUrl,
          githubUrl: old.githubUrl,
          metadata: old.metadata ?? undefined,
        },
      });

      await tx.application.updateMany({
        where: { userId: oldId },
        data: { userId: authUser.id },
      });
      await tx.profile.updateMany({
        where: { userId: oldId },
        data: { userId: authUser.id },
      });
      await tx.user.delete({ where: { id: oldId } });
      return user;
    });
  }

  private async ensureDefaultProfile(userId: string): Promise<void> {
    const profileCount = await this.prisma.profile.count({
      where: { userId },
    });

    if (profileCount === 0) {
      await this.prisma.profile.create({
        data: {
          userId,
          profileTitle: DEFAULT_PROFILE_TITLE,
          jobTitle: DEFAULT_JOB_TITLE,
          seniority: SeniorityLevel.JUNIOR,
          primaryIndustry: ProfileIndustry.OTHER,
          isDefault: true,
        },
      });
    }
  }
}
