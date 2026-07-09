import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../auth/auth.types';
import { patchMeSchema, PatchMeInput } from '../shared/schemas/user.schema';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Current user + default profile + usage' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update account-level fields' })
  patchMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(patchMeSchema)) body: PatchMeInput,
  ) {
    return this.usersService.patchMe(user.id, body);
  }
}
