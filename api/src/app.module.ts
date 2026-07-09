import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { AuthModule } from './auth/auth.module';
import { CvModule } from './cv/cv.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { AutofillModule } from './autofill/autofill.module';
import { ApplicationsModule } from './applications/applications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfilesModule } from './profiles/profiles.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    CvModule,
    AssessmentsModule,
    JobsModule,
    ApplicationsModule,
    AutofillModule,
    HealthModule,
  ],
})
export class AppModule {}
