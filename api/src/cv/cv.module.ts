import { Module } from '@nestjs/common';
import { AssessmentsModule } from '../assessments/assessments.module';
import { QueueModule } from '../queue/queue.module';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';

@Module({
  imports: [QueueModule, AssessmentsModule],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}
