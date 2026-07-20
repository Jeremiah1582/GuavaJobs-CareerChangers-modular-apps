import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { CvModule } from '../cv/cv.module';
import { UsersModule } from '../users/users.module';
import { CareerCvService } from './career-cv.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [CvModule, AssessmentsModule, AiModule, UsersModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, CareerCvService],
  exports: [ProfilesService, CareerCvService],
})
export class ProfilesModule {}
