import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  saveJobBodySchema,
  SaveJobBody,
  savedJobsListQuerySchema,
} from '../shared/schemas/saved-job.schema';
import { SavedJobsService } from './saved-jobs.service';
import { z } from 'zod';

@ApiTags('saved-jobs')
@ApiBearerAuth()
@Controller('saved-jobs')
export class SavedJobsController {
  constructor(private readonly savedJobs: SavedJobsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List bookmarked jobs (pointers + thin card). Pass resolve=1 to re-pull live status.',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(savedJobsListQuerySchema))
    query: z.infer<typeof savedJobsListQuerySchema>,
  ) {
    return this.savedJobs.list(user.id, { resolve: query.resolve });
  }

  @Get('keys')
  @ApiOperation({
    summary: 'List bookmarked canonicalKeys only (for heart state on search)',
  })
  listKeys(@CurrentUser() user: AuthenticatedUser) {
    return this.savedJobs.listKeys(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Bookmark a job by canonicalKey (thin card fields optional)',
  })
  save(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(saveJobBodySchema)) body: SaveJobBody,
  ) {
    return this.savedJobs.save(user.id, body);
  }

  @Delete(':canonicalKey')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove bookmark by canonicalKey' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('canonicalKey') canonicalKey: string,
  ) {
    await this.savedJobs.remove(user.id, canonicalKey);
  }
}
