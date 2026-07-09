import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CvParseStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { CvParseService } from '../cv/cv-parse.service';
import { StorageService } from '../cv/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CV_PARSE_QUEUE, CvParseJobData } from './queue.constants';

@Processor(CV_PARSE_QUEUE)
export class CvParseProcessor extends WorkerHost {
  private readonly logger = new Logger(CvParseProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly cvParse: CvParseService,
  ) {
    super();
  }

  async process(job: Job<CvParseJobData>): Promise<void> {
    const { cvDocumentId } = job.data;

    const cv = await this.prisma.cvDocument.findUnique({
      where: { id: cvDocumentId },
    });

    if (!cv) {
      this.logger.warn(`CV document ${cvDocumentId} not found; skipping parse`);
      return;
    }

    try {
      const buffer = await this.storage.downloadObject(cv.storageKey);
      const parsedText = await this.cvParse.extractText(
        buffer,
        cv.mimeType,
        cv.fileName,
      );

      await this.prisma.cvDocument.update({
        where: { id: cvDocumentId },
        data: {
          parsedText,
          parseStatus: CvParseStatus.READY,
        },
      });

      this.logger.log(`CV parse complete: ${cvDocumentId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown parse error';
      this.logger.error(`CV parse failed for ${cvDocumentId}: ${message}`);

      await this.prisma.cvDocument.update({
        where: { id: cvDocumentId },
        data: { parseStatus: CvParseStatus.FAILED },
      });

      throw error;
    }
  }
}
