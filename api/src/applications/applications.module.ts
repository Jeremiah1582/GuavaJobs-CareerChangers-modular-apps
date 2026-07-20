import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { shouldRunBullmqWorkers } from '../config/workers';
import { JobsModule } from '../jobs/jobs.module';
import { PdfModule } from '../pdf/pdf.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AiGenerationProcessor } from '../queue/ai-generation.processor';
import { QueueModule } from '../queue/queue.module';
import { UsersModule } from '../users/users.module';
import { ApplicationAiWorkerService } from './application-ai-worker.service';
import { ApplicationEventsController } from './application-events.controller';
import { ApplicationEventsService } from './application-events.service';
import { ApplicationGenerateService } from './application-generate.service';
import { ApplicationManualService } from './application-manual.service';
import { ApplicationSnapshotService } from './application-snapshot.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { IdempotencyService } from './idempotency.service';

const workerProviders = shouldRunBullmqWorkers() ? [AiGenerationProcessor] : [];

@Module({
  imports: [
    QueueModule,
    AiModule,
    JobsModule,
    UsersModule,
    PdfModule,
    ProfilesModule,
  ],
  controllers: [ApplicationsController, ApplicationEventsController],
  providers: [
    ApplicationsService,
    ApplicationGenerateService,
    ApplicationManualService,
    ApplicationEventsService,
    ApplicationSnapshotService,
    ApplicationAiWorkerService,
    ...workerProviders,
    IdempotencyService,
  ],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
