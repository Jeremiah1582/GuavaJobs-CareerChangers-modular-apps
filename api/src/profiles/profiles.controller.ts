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
import {
  patchCareerCvSchema,
  PatchCareerCvInput,
} from '../shared/schemas/career-cv.schema';
import { CareerCvService } from './career-cv.service';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly careerCvService: CareerCvService,
  ) {}

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

  @Get(':id/career-cv')
  @ApiOperation({ summary: 'Get master career corpus (anonymous JSON)' })
  getCareerCv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.careerCvService.getByProfileId(user.id, id);
  }

  @Patch(':id/career-cv')
  @ApiOperation({ summary: 'Upsert/merge master career content or enrichments' })
  patchCareerCv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(patchCareerCvSchema)) body: PatchCareerCvInput,
  ) {
    return this.careerCvService.patch(user.id, id, body);
  }
}
