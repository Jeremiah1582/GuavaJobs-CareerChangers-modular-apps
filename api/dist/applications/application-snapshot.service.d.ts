import { StorageService } from '../cv/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnifiedJob } from '../shared/schemas/job.schema';
export type SnapshotBundle = {
    jobSnapshot: Record<string, unknown>;
    profileSnapshot: Record<string, unknown>;
    cvSnapshot: Record<string, unknown>;
    cvStorageKey: string | null;
    applyUrl: string;
};
export declare class ApplicationSnapshotService {
    private readonly prisma;
    private readonly storage;
    constructor(prisma: PrismaService, storage: StorageService);
    buildForGenerate(userId: string, profileId: string, applicationId: string, job: UnifiedJob): Promise<SnapshotBundle>;
    private profileToSnapshot;
    private copyCvForApplication;
}
