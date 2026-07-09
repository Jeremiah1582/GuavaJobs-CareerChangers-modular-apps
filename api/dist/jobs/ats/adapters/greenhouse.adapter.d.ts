import { UnifiedJob } from '../../../shared/schemas/job.schema';
export declare class GreenhouseAdapter {
    fetchJob(board: string, jobId: string): Promise<UnifiedJob | null>;
}
