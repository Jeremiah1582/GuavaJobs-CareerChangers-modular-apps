import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsageService],
  exports: [UsersService, UsageService],
})
export class UsersModule {}
