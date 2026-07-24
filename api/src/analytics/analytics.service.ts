import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsEventItem,
  AnalyticsEventsBody,
  AnalyticsSessionBody,
  jobSearchEventPropertiesSchema,
} from '../shared/schemas/analytics.schema';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async ingestEvents(userId: string, body: AnalyticsEventsBody): Promise<void> {
    const rows = body.events.map((item) => ({
      userId,
      event: item.event,
      properties: this.sanitizeProperties(item) as Prisma.InputJsonValue,
      createdAt: item.timestamp ? new Date(item.timestamp) : undefined,
    }));

    await this.prisma.analyticsEvent.createMany({ data: rows });
  }

  async upsertSession(
    userId: string,
    body: AnalyticsSessionBody,
  ): Promise<void> {
    const now = new Date();

    if (body.ended) {
      await this.prisma.analyticsSession.upsert({
        where: { id: body.sessionId },
        create: {
          id: body.sessionId,
          userId,
          startedAt: now,
          lastSeenAt: now,
          endedAt: now,
          durationMs: body.durationMs ?? null,
        },
        update: {
          lastSeenAt: now,
          endedAt: now,
          ...(body.durationMs !== undefined
            ? { durationMs: body.durationMs }
            : {}),
        },
      });
      return;
    }

    await this.prisma.analyticsSession.upsert({
      where: { id: body.sessionId },
      create: {
        id: body.sessionId,
        userId,
        startedAt: now,
        lastSeenAt: now,
      },
      update: {
        lastSeenAt: now,
      },
    });
  }

  private sanitizeProperties(
    item: AnalyticsEventItem,
  ): Record<string, string | number | boolean | null> {
    const raw = item.properties ?? {};

    if (item.event === 'job_search') {
      const parsed = jobSearchEventPropertiesSchema.safeParse(raw);
      if (parsed.success) {
        const props = { ...parsed.data };
        if (props.primaryIndustry && !props.industry) {
          props.industry = props.primaryIndustry;
        }
        return props as Record<string, string | number | boolean | null>;
      }
      return this.stripUnknown(raw);
    }

    return this.stripUnknown(raw);
  }

  private stripUnknown(
    raw: Record<string, string | number | boolean | null>,
  ): Record<string, string | number | boolean | null> {
    const safe: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
      ) {
        if (typeof value === 'string' && value.length > 500) {
          safe[key] = value.slice(0, 500);
        } else {
          safe[key] = value;
        }
      }
    }
    return safe;
  }
}
