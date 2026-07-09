import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CvDownloadResponse, CvMeta, CvUploadResponse } from '../shared/schemas/cv.schema';
import { CvParseJobData } from '../queue/queue.constants';
import { StorageService } from './storage.service';
export declare class CvService {
    private readonly prisma;
    private readonly storage;
    private readonly cvParseQueue;
    constructor(prisma: PrismaService, storage: StorageService, cvParseQueue: Queue<CvParseJobData>);
    uploadCv(userId: string, profileId: string, file: Express.Multer.File): Promise<CvUploadResponse>;
    getDownloadUrl(userId: string, profileId: string): Promise<CvDownloadResponse>;
    getCurrentCvMeta(profileId: string): Promise<CvMeta | null>;
    private validateFile;
    private extensionFor;
    private assertProfileOwnership;
    private toCvMeta;
}
