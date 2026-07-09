import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check (database, Redis, BullMQ queues)' })
  async check(@Res({ passthrough: true }) res: Response) {
    const { result, httpStatus } = await this.health.check();
    res.status(httpStatus);
    return result;
  }
}
