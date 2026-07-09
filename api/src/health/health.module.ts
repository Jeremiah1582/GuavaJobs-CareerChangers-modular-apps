import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import {
  AI_GENERATION_QUEUE,
  CV_PARSE_QUEUE,
} from '../queue/queue.constants';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: CV_PARSE_QUEUE },
      { name: AI_GENERATION_QUEUE },
    ),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
