import { Injectable } from '@nestjs/common';
import { PlatformRole, Prisma, UserTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import {
  AdminUsersListQuery,
  EngagementSummary,
  PatchUserRoleBody,
} from '../shared/schemas/admin.schema';

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getEngagementSummary(): Promise<EngagementSummary> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalSignups,
      signupSeriesRaw,
      weekdayPeaks,
      dayOfMonthPeaks,
      sessionStats,
      searchRegions,
      loginRegions,
      topTerms,
      topIndustries,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE("createdAt") AS date, COUNT(*)::bigint AS count
        FROM users
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      this.prisma.$queryRaw<Array<{ dow: number; count: bigint }>>`
        SELECT EXTRACT(DOW FROM "createdAt")::int AS dow, COUNT(*)::bigint AS count
        FROM users
        GROUP BY dow
        ORDER BY count DESC
        LIMIT 1
      `,
      this.prisma.$queryRaw<Array<{ dom: number; count: bigint }>>`
        SELECT EXTRACT(DAY FROM "createdAt")::int AS dom, COUNT(*)::bigint AS count
        FROM users
        GROUP BY dom
        ORDER BY count DESC
        LIMIT 1
      `,
      this.prisma.analyticsSession.aggregate({
        where: { endedAt: { not: null }, durationMs: { not: null } },
        _avg: { durationMs: true },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
        SELECT UPPER(properties->>'country') AS country, COUNT(*)::bigint AS count
        FROM analytics_events
        WHERE event = 'job_search'
          AND properties->>'country' IS NOT NULL
          AND properties->>'country' != ''
        GROUP BY UPPER(properties->>'country')
        ORDER BY count DESC
        LIMIT 10
      `,
      this.prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
        SELECT UPPER(properties->>'country') AS country, COUNT(*)::bigint AS count
        FROM analytics_events
        WHERE event = 'login_completed'
          AND properties->>'country' IS NOT NULL
          AND properties->>'country' != ''
        GROUP BY UPPER(properties->>'country')
        ORDER BY count DESC
        LIMIT 10
      `,
      this.prisma.$queryRaw<Array<{ term: string; count: bigint }>>`
        SELECT LOWER(TRIM(properties->>'q')) AS term, COUNT(*)::bigint AS count
        FROM analytics_events
        WHERE event = 'job_search'
          AND properties->>'q' IS NOT NULL
          AND TRIM(properties->>'q') != ''
        GROUP BY LOWER(TRIM(properties->>'q'))
        ORDER BY count DESC
        LIMIT 10
      `,
      this.prisma.$queryRaw<Array<{ industry: string; count: bigint }>>`
        SELECT COALESCE(
          properties->>'primaryIndustry',
          properties->>'industry'
        ) AS industry, COUNT(*)::bigint AS count
        FROM analytics_events
        WHERE event = 'job_search'
          AND COALESCE(properties->>'primaryIndustry', properties->>'industry') IS NOT NULL
        GROUP BY COALESCE(properties->>'primaryIndustry', properties->>'industry')
        ORDER BY count DESC
        LIMIT 10
      `,
    ]);

    const searchMap = new Map(
      searchRegions.map((r) => [r.country, Number(r.count)]),
    );
    const loginMap = new Map(
      loginRegions.map((r) => [r.country, Number(r.count)]),
    );
    const countries = new Set([...searchMap.keys(), ...loginMap.keys()]);
    const topRegions = [...countries]
      .map((country) => {
        const searches = searchMap.get(country) ?? 0;
        const logins = loginMap.get(country) ?? 0;
        return { country, searches, logins, total: searches + logins };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const weekdayPeak = weekdayPeaks[0];
    const dayOfMonthPeak = dayOfMonthPeaks[0];

    return {
      signups: {
        total: totalSignups,
        series: signupSeriesRaw.map((row) => ({
          date: row.date.toISOString().slice(0, 10),
          count: Number(row.count),
        })),
      },
      peaks: {
        weekday: {
          day: weekdayPeak?.dow ?? 0,
          label: WEEKDAY_LABELS[weekdayPeak?.dow ?? 0] ?? 'Sunday',
          count: Number(weekdayPeak?.count ?? 0),
        },
        dayOfMonth: {
          day: dayOfMonthPeak?.dom ?? 1,
          count: Number(dayOfMonthPeak?.count ?? 0),
        },
      },
      sessions: {
        avgDurationMs: sessionStats._avg.durationMs
          ? Math.round(sessionStats._avg.durationMs)
          : null,
        totalEnded: sessionStats._count._all,
      },
      topRegions,
      topSearchTerms: topTerms.map((t) => ({
        term: t.term,
        count: Number(t.count),
      })),
      topIndustries: topIndustries.map((i) => ({
        industry: i.industry,
        count: Number(i.count),
      })),
    };
  }

  async listEngagementUsers(query: AdminUsersListQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          tier: true,
          platformRole: true,
          createdAt: true,
          profiles: {
            where: { isDefault: true },
            take: 1,
            select: { locationCountry: true },
          },
        },
      }),
    ]);

    const userIds = users.map((u) => u.id);
    const lastActive = await this.getLastActiveByUser(userIds);

    return {
      results: users.map((u) => ({
        id: u.id,
        name: u.name,
        tier: u.tier,
        platformRole: u.platformRole,
        region: u.profiles[0]?.locationCountry ?? null,
        joinedAt: u.createdAt.toISOString(),
        lastActiveAt: lastActive.get(u.id) ?? null,
      })),
      page,
      limit,
      total,
    };
  }

  async listOwnerUsers(query: AdminUsersListQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          tier: true,
          platformRole: true,
          createdAt: true,
          profiles: {
            where: { isDefault: true },
            take: 1,
            select: { locationCountry: true },
          },
        },
      }),
    ]);

    const userIds = users.map((u) => u.id);
    const lastActive = await this.getLastActiveByUser(userIds);

    return {
      results: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        tier: u.tier,
        platformRole: u.platformRole,
        region: u.profiles[0]?.locationCountry ?? null,
        joinedAt: u.createdAt.toISOString(),
        lastActiveAt: lastActive.get(u.id) ?? null,
      })),
      page,
      limit,
      total,
    };
  }

  async patchUserRole(
    actorId: string,
    targetUserId: string,
    body: PatchUserRoleBody,
  ) {
    if (actorId === targetUserId && body.platformRole !== PlatformRole.OWNER) {
      const actor = await this.prisma.user.findUniqueOrThrow({
        where: { id: actorId },
      });
      if (actor.platformRole === PlatformRole.OWNER) {
        throw new AppError(
          'FORBIDDEN',
          'Owners cannot demote themselves',
          403,
        );
      }
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    if (
      target.platformRole === PlatformRole.OWNER &&
      body.platformRole !== PlatformRole.OWNER
    ) {
      const ownerCount = await this.prisma.user.count({
        where: { platformRole: PlatformRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new AppError(
          'FORBIDDEN',
          'Cannot demote the last platform owner',
          403,
        );
      }
    }

    const tier: UserTier =
      body.platformRole === PlatformRole.ADMIN ||
      body.platformRole === PlatformRole.OWNER
        ? UserTier.PAID
        : target.tier;

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        platformRole: body.platformRole,
        tier,
      },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        platformRole: true,
        createdAt: true,
        profiles: {
          where: { isDefault: true },
          take: 1,
          select: { locationCountry: true },
        },
      },
    });

    const lastActive = await this.getLastActiveByUser([updated.id]);

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      tier: updated.tier,
      platformRole: updated.platformRole,
      region: updated.profiles[0]?.locationCountry ?? null,
      joinedAt: updated.createdAt.toISOString(),
      lastActiveAt: lastActive.get(updated.id) ?? null,
    };
  }

  private async getLastActiveByUser(
    userIds: string[],
  ): Promise<Map<string, string>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ userId: string; lastAt: Date }>
    >`
      SELECT "userId", MAX("lastSeenAt") AS "lastAt"
      FROM analytics_sessions
      WHERE "userId" IN (${Prisma.join(userIds)})
      GROUP BY "userId"
    `;

    return new Map(
      rows.map((r) => [r.userId, r.lastAt.toISOString()]),
    );
  }
}
