import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import {
  ListApplicationsQuery,
  PatchApplicationInput,
} from '../shared/schemas/application.schema';
import { toApplicationResponse } from './application.mapper';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListApplicationsQuery) {
    const where: Prisma.ApplicationWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.sourceOfListing
        ? { sourceOfListing: query.sourceOfListing }
        : {}),
      ...(query.companyName
        ? { companyName: { contains: query.companyName, mode: 'insensitive' } }
        : {}),
    };

    const apps = await this.prisma.application.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { atsReport: true },
    });

    return apps.map((a) => toApplicationResponse(a));
  }

  async getById(userId: string, applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { atsReport: true, events: { orderBy: { occurredAt: 'desc' } } },
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }
    return toApplicationResponse(app, true);
  }

  async patch(userId: string, applicationId: string, input: PatchApplicationInput) {
    await this.assertOwned(userId, applicationId);

    const data: Prisma.ApplicationUpdateInput = {
      ...input,
      jobStartDate:
        input.jobStartDate === undefined
          ? undefined
          : input.jobStartDate
            ? new Date(input.jobStartDate)
            : null,
      appliedAt:
        input.appliedAt === undefined
          ? undefined
          : input.appliedAt
            ? new Date(input.appliedAt)
            : null,
    };

    if (input.coverLetterContent !== undefined) {
      data.coverLetterEdited = input.coverLetterEdited ?? true;
    }

    const app = await this.prisma.application.update({
      where: { id: applicationId },
      data,
      include: { atsReport: true },
    });

    return toApplicationResponse(app);
  }

  private async assertOwned(userId: string, applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }
  }
}
