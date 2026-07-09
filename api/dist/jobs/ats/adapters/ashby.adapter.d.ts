import { UnifiedJob } from '../../../shared/schemas/job.schema';
export declare class AshbyAdapter {
    fetchJob(boardName: string, jobPostingId: string): Promise<UnifiedJob | null>;
}
