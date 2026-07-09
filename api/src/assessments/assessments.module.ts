import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ProfileAtsController } from './profile-ats.controller';
import { ProfileAtsService } from './profile-ats.service';

@Module({
  imports: [AiModule],
  controllers: [ProfileAtsController],
  providers: [ProfileAtsService],
  exports: [ProfileAtsService],
})
export class AssessmentsModule {}
