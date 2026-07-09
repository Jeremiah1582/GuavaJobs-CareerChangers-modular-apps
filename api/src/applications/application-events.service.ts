import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import {
  CreateApplicationEventInput,
  ListEventsQuery,
  PatchApplicationEventInput,
} from '../shared/schemas/application-event.schema';

@Injectable()
export class ApplicationEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, applicationId: string, query: ListEventsQuery) {
    await this.assertOwned(userId, applicationId);

    const events = await this.prisma.applicationEvent.findMany({
      where: {
        applicationId,
        ...(query.eventType ? { eventType: query.eventType } : {}),
      },
      orderBy: { occurredAt: 'desc' },
    });

    return events.map((e) => this.toResponse(e));
  }

  async create(
    userId: string,
    applicationId: string,
    input: CreateApplicationEventInput,
  ) {
    await this.assertOwned(userId, applicationId);

    const event = await this.prisma.applicationEvent.create({
      data: {
        applicationId,
        eventType: input.eventType,
        occurredAt: new Date(input.occurredAt),
        content: input.content,
        contactName: input.contactName,
      },
    });

    return this.toResponse(event);
  }

  async patch(
    userId: string,
    applicationId: string,
    eventId: string,
    input: PatchApplicationEventInput,
  ) {
    await this.assertOwnedEvent(userId, applicationId, eventId);

    const data: Prisma.ApplicationEventUpdateInput = {
      ...input,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
    };

    const event = await this.prisma.applicationEvent.update({
      where: { id: eventId },
      data,
    });

    return this.toResponse(event);
  }

  async remove(userId: string, applicationId: string, eventId: string) {
    await this.assertOwnedEvent(userId, applicationId, eventId);
    await this.prisma.applicationEvent.delete({ where: { id: eventId } });
    return { deleted: true };
  }

  private async assertOwned(userId: string, applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }
  }

  private async assertOwnedEvent(
    userId: string,
    applicationId: string,
    eventId: string,
  ) {
    await this.assertOwned(userId, applicationId);
    const event = await this.prisma.applicationEvent.findFirst({
      where: { id: eventId, applicationId },
    });
    if (!event) {
      throw new AppError('EVENT_NOT_FOUND', 'Event not found', 404);
    }
  }

  private toResponse(event: {
    id: string;
    eventType: string;
    occurredAt: Date;
    content: string;
    contactName: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: event.id,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      content: event.content,
      contactName: event.contactName,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
