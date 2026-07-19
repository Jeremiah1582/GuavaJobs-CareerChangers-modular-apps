import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StorageService } from '../cv/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import {
  ListApplicationsQuery,
  PatchApplicationInput,
} from '../shared/schemas/application.schema';
import {
  applicationDetailInclude,
  applicationListInclude,
  toApplicationResponse,
} from './application.mapper';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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
      include: applicationListInclude,
    });

    return apps.map((a) => toApplicationResponse(a));
  }

  async getById(userId: string, applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: {
        ...applicationDetailInclude,
        events: { orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }
    return toApplicationResponse(app, true);
  }

  async patch(userId: string, applicationId: string, input: PatchApplicationInput) {
    const current = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });
    if (!current) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }

    const {
      generatedCvContent,
      cvChoice,
      jobStartDate,
      appliedAt,
      coverLetterContent,
      coverLetterEdited,
      pastedJobDescription,
      ...rest
    } = input;

    const data: Prisma.ApplicationUpdateInput = {
      ...rest,
      ...(cvChoice !== undefined ? { cvChoice } : {}),
      jobStartDate:
        jobStartDate === undefined
          ? undefined
          : jobStartDate
            ? new Date(jobStartDate)
            : null,
      appliedAt:
        appliedAt === undefined
          ? undefined
          : appliedAt
            ? new Date(appliedAt)
            : null,
    };

    if (coverLetterContent !== undefined) {
      data.coverLetterContent = coverLetterContent;
      data.coverLetterEdited = coverLetterEdited ?? true;
    }

    if (pastedJobDescription !== undefined) {
      data.pastedJobDescription = pastedJobDescription;
      // Keep UI "full JD" and regenerate aligned: merge into snapshot.description.
      if (typeof pastedJobDescription === 'string' && pastedJobDescription.trim()) {
        const existing =
          current.jobSnapshot &&
          typeof current.jobSnapshot === 'object' &&
          !Array.isArray(current.jobSnapshot)
            ? { ...(current.jobSnapshot as Record<string, unknown>) }
            : {};
        data.jobSnapshot = {
          ...existing,
          description: pastedJobDescription.trim(),
        } as Prisma.InputJsonValue;
      }
    }

    if (generatedCvContent) {
      const existing = await this.prisma.generatedCv.findUnique({
        where: { applicationId },
      });
      if (!existing) {
        throw new AppError(
          'GENERATED_CV_NOT_FOUND',
          'No generated CV on this application',
          400,
        );
      }
      await this.prisma.generatedCv.update({
        where: { applicationId },
        data: {
          content: generatedCvContent as Prisma.InputJsonValue,
          edited: true,
        },
      });
    }

    const app = await this.prisma.application.update({
      where: { id: applicationId },
      data,
      include: applicationDetailInclude,
    });

    return toApplicationResponse(app);
  }

  async getHydratedGeneratedCvExport(userId: string, applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: applicationDetailInclude,
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }
    if (!app.generatedCv) {
      throw new AppError(
        'GENERATED_CV_NOT_FOUND',
        'No generated CV on this application',
        404,
      );
    }
    const response = toApplicationResponse(app);
    if (!response.generatedCvExport) {
      throw new AppError(
        'GENERATED_CV_INVALID',
        'Generated CV could not be hydrated',
        500,
      );
    }
    return response.generatedCvExport;
  }

  /**
   * Hard-delete an owned application. Cascades ATS report, GeneratedCv, and
   * events via Prisma; also removes the application-scoped CV copy in storage.
   * Profile and master CV are never deleted.
   */
  async remove(userId: string, applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      select: { id: true, cvStorageKey: true },
    });
    if (!app) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }

    const cvStorageKey = app.cvStorageKey;

    await this.prisma.application.delete({ where: { id: applicationId } });

    if (cvStorageKey) {
      try {
        await this.storage.removeObject(cvStorageKey);
      } catch (err) {
        this.logger.warn(
          `Failed to remove CV storage object for application ${applicationId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return { deleted: true };
  }
}
