import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ApplicationAiWorkerService } from '../applications/application-ai-worker.service';
import { AiGenerationJobData } from './queue.constants';
export declare class AiGenerationProcessor extends WorkerHost {
    private readonly aiWorker;
    private readonly logger;
    constructor(aiWorker: ApplicationAiWorkerService);
    process(job: Job<AiGenerationJobData>): Promise<void>;
}
