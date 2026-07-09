import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ApplicationAiWorkerService } from '../applications/application-ai-worker.service';
import {
  AI_GENERATION_QUEUE,
  AiGenerationJobData,
} from './queue.constants';

@Processor(AI_GENERATION_QUEUE)
export class AiGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(AiGenerationProcessor.name);

  constructor(private readonly aiWorker: ApplicationAiWorkerService) {
    super();
  }

  async process(job: Job<AiGenerationJobData>): Promise<void> {
    this.logger.log(
      `Processing ${job.data.type} for application ${job.data.applicationId}`,
    );
    await this.aiWorker.process(job.data);
  }
}
