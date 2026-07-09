import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  createProfileSchema,
  CreateProfileInput,
  patchProfileSchema,
  PatchProfileInput,
} from '../shared/schemas/profile.schema';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'List profiles for current user' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create profile (primaryIndustry required)' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createProfileSchema)) body: CreateProfileInput,
  ) {
    return this.profilesService.create(user.id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile by id' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.profilesService.getById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update profile (e.g. primaryIndustry)' })
  patch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(patchProfileSchema)) body: PatchProfileInput,
  ) {
    return this.profilesService.patch(user.id, id, body);
  }
}
