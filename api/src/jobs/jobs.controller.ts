import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  jobSearchQuerySchema,
  JobSearchQuery,
} from '../shared/schemas/job.schema';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search jobs via Adzuna with ATS enrichment' })
  search(
    @Query(new ZodValidationPipe(jobSearchQuerySchema)) query: JobSearchQuery,
  ) {
    return this.jobsService.search(query);
  }

  @Get(':canonicalKey')
  @ApiOperation({
    summary:
      'Job detail by canonical key (URL-encode colons as %3A). Use ?expand=ats to fetch employer ATS description when available.',
  })
  getByKey(
    @Param('canonicalKey') canonicalKey: string,
    @Query('expand') expand?: string,
  ) {
    return this.jobsService.getByCanonicalKey(canonicalKey, {
      expandAts: expand === 'ats',
    });
  }
}
