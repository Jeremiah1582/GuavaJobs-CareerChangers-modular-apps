import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { AppError } from '../shared/schemas/error.schema';
import { MarketFitService } from './market-fit.service';

@ApiTags('market-fit')
@ApiBearerAuth()
@Controller('profiles/:profileId/market-fit')
export class MarketFitController {
  constructor(private readonly marketFitService: MarketFitService) {}

  @Get()
  @ApiOperation({
    summary: 'Get cached Market Fit result (free; no AI quota)',
  })
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
  ) {
    const cached = await this.marketFitService.getCached(user.id, profileId);
    if (!cached) {
      throw new AppError(
        'MARKET_FIT_NOT_FOUND',
        'No Market Fit result yet — generate one first',
        404,
      );
    }
    return cached;
  }

  @Post()
  @ApiOperation({
    summary:
      'Generate Market Fit: 5 skill-based roles + regional salary bands (free; no AI quota; paywall reserved)',
  })
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
  ) {
    return this.marketFitService.generate(user.id, profileId);
  }
}
