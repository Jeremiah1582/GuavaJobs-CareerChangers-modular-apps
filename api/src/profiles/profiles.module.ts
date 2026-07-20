import { Module } from '@nestjs/common';
import { AssessmentsModule } from '../assessments/assessments.module';
import { CvModule } from '../cv/cv.module';
import { CareerCvService } from './career-cv.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [CvModule, AssessmentsModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, CareerCvService],
  exports: [ProfilesService, CareerCvService],
})
export class ProfilesModule {}
