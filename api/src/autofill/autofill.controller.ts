import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { AutofillService } from './autofill.service';

@ApiTags('applications')
@ApiBearerAuth()
@Controller('applications')
export class AutofillController {
  constructor(private readonly autofill: AutofillService) {}

  @Get(':id/autofill-payload')
  @ApiOperation({
    summary:
      'WebView autofill payload — factual fields + ATS field map for on-device inject',
  })
  getPayload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.autofill.getPayload(user.id, id);
  }
}
