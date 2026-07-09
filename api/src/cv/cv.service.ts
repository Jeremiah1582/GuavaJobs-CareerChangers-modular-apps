import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { CvParseStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import {
  CvDownloadResponse,
  CvMeta,
  CvUploadResponse,
} from '../shared/schemas/cv.schema';
import { CV_PARSE_QUEUE, CvParseJobData } from '../queue/queue.constants';
import { StorageService } from './storage.service';

const MAX_CV_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue(CV_PARSE_QUEUE) private readonly cvParseQueue: Queue<CvParseJobData>,
  ) {}

  async uploadCv(
    userId: string,
    profileId: string,
    file: Express.Multer.File,
  ): Promise<CvUploadResponse> {
    await this.assertProfileOwnership(userId, profileId);
    this.validateFile(file);

    const ext = this.extensionFor(file);
    const cvId = randomUUID();
    const storageKey = `profiles/${profileId}/cv/${cvId}.${ext}`;

    await this.storage.uploadObject(storageKey, file.buffer, file.mimetype);

    const cv = await this.prisma.$transaction(async (tx) => {
      if (await tx.profile.findFirst({ where: { id: profileId, userId } })) {
        const previous = await tx.cvDocument.findMany({
          where: { profileId, isActive: true },
        });
        if (previous.length) {
          await tx.cvDocument.updateMany({
            where: { profileId, isActive: true },
            data: { isActive: false },
          });
        }
      }

      const created = await tx.cvDocument.create({
        data: {
          id: cvId,
          profileId,
          storageKey,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
          parseStatus: CvParseStatus.PENDING,
          isActive: true,
        },
      });

      await tx.profile.update({
        where: { id: profileId },
        data: { currentCvId: created.id },
      });

      return created;
    });

    await this.cvParseQueue.add(
      'parse',
      { cvDocumentId: cv.id, profileId, userId },
      {
        jobId: `cv-parse-${cv.id}`,
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return {
      profileId,
      currentCvId: cv.id,
      cv: this.toCvMeta(cv),
    };
  }

  async getDownloadUrl(
    userId: string,
    profileId: string,
  ): Promise<CvDownloadResponse> {
    await this.assertProfileOwnership(userId, profileId);

    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
      include: { currentCv: true },
    });

    if (!profile?.currentCv) {
      throw new AppError('CV_NOT_FOUND', 'No CV uploaded for this profile', 404);
    }

    const { signedUrl, expiresInSeconds } =
      await this.storage.createSignedDownloadUrl(profile.currentCv.storageKey);

    return {
      signedUrl,
      expiresInSeconds,
      fileName: profile.currentCv.fileName,
    };
  }

  async getCurrentCvMeta(
    profileId: string,
  ): Promise<CvMeta | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: { currentCv: true },
    });
    if (!profile?.currentCv) {
      return null;
    }
    return this.toCvMeta(profile.currentCv);
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file?.buffer?.length) {
      throw new AppError('VALIDATION_ERROR', 'CV file is required', 400);
    }
    if (file.size > MAX_CV_BYTES) {
      throw new AppError(
        'VALIDATION_ERROR',
        `CV must be ${MAX_CV_BYTES / 1024 / 1024}MB or smaller`,
        400,
      );
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'CV must be PDF, DOCX, or plain text',
        400,
      );
    }
  }

  private extensionFor(file: Express.Multer.File): string {
    const fromName = file.originalname.split('.').pop()?.toLowerCase();
    if (fromName === 'pdf') return 'pdf';
    if (fromName === 'docx') return 'docx';
    if (fromName === 'txt') return 'txt';
    if (file.mimetype === 'application/pdf') return 'pdf';
    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return 'docx';
    }
    return 'bin';
  }

  private async assertProfileOwnership(
    userId: string,
    profileId: string,
  ): Promise<void> {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
    });
    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }
  }

  private toCvMeta(cv: {
    id: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    parseStatus: CvParseStatus;
    uploadedAt: Date;
  }): CvMeta {
    return {
      id: cv.id,
      fileName: cv.fileName,
      mimeType: cv.mimeType,
      fileSizeBytes: cv.fileSizeBytes,
      parseStatus: cv.parseStatus,
      uploadedAt: cv.uploadedAt.toISOString(),
    };
  }
}
