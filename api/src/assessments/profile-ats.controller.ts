import { Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { ProfileAtsService } from './profile-ats.service';

@ApiTags('assessments')
@ApiBearerAuth()
@Controller('profiles/:profileId/ats-assessment')
export class ProfileAtsController {
  constructor(private readonly profileAtsService: ProfileAtsService) {}

  @Post()
  @ApiOperation({
    summary: 'Run industry-specific profile ATS assessment (free; no quota)',
  })
  run(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
  ) {
    return this.profileAtsService.runAssessment(user.id, profileId);
  }
}
