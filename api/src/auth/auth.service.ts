import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformRole, Prisma, ProfileIndustry, SeniorityLevel, User, UserTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EnvConfig } from '../config/env.validation';
import { AppError } from '../shared/schemas/error.schema';
import { AuthenticatedUser, JwtClaims } from './auth.types';

const DEFAULT_PROFILE_TITLE = 'Default';
const DEFAULT_JOB_TITLE = 'Job Seeker';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  claimsToAuthUser(claims: JwtClaims): Omit<AuthenticatedUser, 'platformRole'> {
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
  async syncUser(
    authUser: Omit<AuthenticatedUser, 'platformRole'>,
  ): Promise<User> {
    try {
      const ownerEmails = this.getOwnerEmails();
      const isOwnerEmail = ownerEmails.has(authUser.email.toLowerCase());

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
            ...(isOwnerEmail && byId.platformRole !== PlatformRole.OWNER
              ? { platformRole: PlatformRole.OWNER, tier: UserTier.PAID }
              : {}),
          },
        });
        await this.ensureDefaultProfile(user.id);
        return user;
      }

      const byEmail = await this.prisma.user.findUnique({
        where: { email: authUser.email },
      });

      if (byEmail) {
        const user = await this.rekeyUser(byEmail.id, authUser, isOwnerEmail);
        await this.ensureDefaultProfile(user.id);
        return user;
      }

      const user = await this.prisma.user.create({
        data: {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          imgUrl: authUser.imgUrl,
          ...(isOwnerEmail
            ? { platformRole: PlatformRole.OWNER, tier: UserTier.PAID }
            : {}),
        },
      });
      await this.ensureDefaultProfile(user.id);
      await this.recordAnalyticsEvent(user.id, 'signup_completed', {});
      return user;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === 'P2021' || err.code === 'P2022')
      ) {
        throw err;
      }
      throw err;
    }
  }

  private getOwnerEmails(): Set<string> {
    const raw = this.config.get('PLATFORM_OWNER_EMAILS', { infer: true }) ?? '';
    return new Set(
      raw
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  private async recordAnalyticsEvent(
    userId: string,
    event: string,
    properties: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          userId,
          event,
          properties: properties as Prisma.InputJsonValue,
        },
      });
    } catch {
      // Analytics must never block auth
    }
  }

  /**
   * Seed/demo rows may use a placeholder id — re-key to the Supabase Auth UUID.
   * Sequential steps (no $transaction) so Supabase transaction pooler works.
   */
  private async rekeyUser(
    oldId: string,
    authUser: Omit<AuthenticatedUser, 'platformRole'>,
    isOwnerEmail: boolean,
  ): Promise<User> {
    const old = await this.prisma.user.findUniqueOrThrow({
      where: { id: oldId },
    });

    const tempEmail = `rekey-${authUser.id}@internal.guavajobs.local`;

    await this.prisma.user.update({
      where: { id: oldId },
      data: { email: tempEmail },
    });

    const user = await this.prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        imgUrl: authUser.imgUrl,
        tier: old.tier,
        platformRole: isOwnerEmail ? PlatformRole.OWNER : old.platformRole,
        aiGenerationsUsedPeriod: old.aiGenerationsUsedPeriod,
        usagePeriodStart: old.usagePeriodStart,
        linkedinUrl: old.linkedinUrl,
        githubUrl: old.githubUrl,
        metadata: old.metadata ?? undefined,
        ...(isOwnerEmail ? { tier: UserTier.PAID } : {}),
      },
    });

    await this.prisma.application.updateMany({
      where: { userId: oldId },
      data: { userId: authUser.id },
    });
    await this.prisma.profile.updateMany({
      where: { userId: oldId },
      data: { userId: authUser.id },
    });
    await this.prisma.user.delete({ where: { id: oldId } });

    return user;
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
