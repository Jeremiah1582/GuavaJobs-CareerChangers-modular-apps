import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.validation';
import { CvParseService } from '../cv/cv-parse.service';
import { StorageService } from '../cv/storage.service';
import { AiGenerationProcessor } from './ai-generation.processor';
import { CvParseProcessor } from './cv-parse.processor';
import { AI_GENERATION_QUEUE, CV_PARSE_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => ({
        connection: {
          url: config.get('REDIS_URL', { infer: true }),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: CV_PARSE_QUEUE },
      { name: AI_GENERATION_QUEUE },
    ),
  ],
  providers: [CvParseProcessor, CvParseService, StorageService],
  exports: [BullModule, StorageService, CvParseService],
})
export class QueueModule {}
