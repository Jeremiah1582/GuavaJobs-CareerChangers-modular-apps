import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  analyticsEventsBodySchema,
  AnalyticsEventsBody,
  analyticsSessionBodySchema,
  AnalyticsSessionBody,
} from '../shared/schemas/analytics.schema';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('events')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Ingest allowlisted engagement events (authenticated)',
  })
  async ingestEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(analyticsEventsBodySchema))
    body: AnalyticsEventsBody,
  ): Promise<void> {
    await this.analytics.ingestEvents(user.id, body);
  }

  @Post('sessions')
  @HttpCode(204)
  @ApiOperation({ summary: 'Session heartbeat or end (authenticated)' })
  async upsertSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(analyticsSessionBodySchema))
    body: AnalyticsSessionBody,
  ): Promise<void> {
    await this.analytics.upsertSession(user.id, body);
  }
}
