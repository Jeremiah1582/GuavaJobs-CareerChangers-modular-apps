import { Injectable, Logger } from '@nestjs/common';
import { CvParseStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import {
  CvDownloadResponse,
  CvMeta,
  CvUploadResponse,
} from '../shared/schemas/cv.schema';
import { CvParseService } from './cv-parse.service';
import { StorageService } from './storage.service';

const MAX_CV_BYTES = 5 * 1024 * 1024;
const PARSE_TIMEOUT_MS = 45_000;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly cvParse: CvParseService,
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

    // Parse in-request so uploads never hang forever waiting on BullMQ workers.
    const resolved = await this.parseInline(
      cv.id,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    return {
      profileId,
      currentCvId: cv.id,
      cv: this.toCvMeta(resolved),
    };
  }

  /**
   * Re-run parse for a stuck PENDING CV (e.g. uploaded before inline parse shipped).
   */
  async reparseCurrentCv(userId: string, profileId: string): Promise<CvMeta> {
    await this.assertProfileOwnership(userId, profileId);

    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
      include: { currentCv: true },
    });
    if (!profile?.currentCv) {
      throw new AppError('CV_NOT_FOUND', 'No CV uploaded for this profile', 404);
    }

    const cv = profile.currentCv;
    if (cv.parseStatus === CvParseStatus.READY && cv.parsedText) {
      return this.toCvMeta(cv);
    }

    const buffer = await this.storage.downloadObject(cv.storageKey);
    const resolved = await this.parseInline(
      cv.id,
      buffer,
      cv.mimeType,
      cv.fileName,
    );
    return this.toCvMeta(resolved);
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

  async getCurrentCvMeta(profileId: string): Promise<CvMeta | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: { currentCv: true },
    });
    if (!profile?.currentCv) {
      return null;
    }
    return this.toCvMeta(profile.currentCv);
  }

  private async parseInline(
    cvDocumentId: string,
    buffer: Buffer,
    mimeType: string,
    fileName: string,
  ) {
    try {
      const parsedText = await withTimeout(
        this.cvParse.extractText(buffer, mimeType, fileName),
        PARSE_TIMEOUT_MS,
        'CV text extraction timed out',
      );

      return this.prisma.cvDocument.update({
        where: { id: cvDocumentId },
        data: {
          parsedText,
          parseStatus: CvParseStatus.READY,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown parse error';
      this.logger.warn(`Inline CV parse failed for ${cvDocumentId}: ${message}`);

      return this.prisma.cvDocument.update({
        where: { id: cvDocumentId },
        data: { parseStatus: CvParseStatus.FAILED },
      });
    }
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

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
