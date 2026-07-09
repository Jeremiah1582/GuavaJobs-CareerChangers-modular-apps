import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CvParseService } from '../cv/cv-parse.service';
import { StorageService } from '../cv/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CvParseJobData } from './queue.constants';
export declare class CvParseProcessor extends WorkerHost {
    private readonly prisma;
    private readonly storage;
    private readonly cvParse;
    private readonly logger;
    constructor(prisma: PrismaService, storage: StorageService, cvParse: CvParseService);
    process(job: Job<CvParseJobData>): Promise<void>;
}
