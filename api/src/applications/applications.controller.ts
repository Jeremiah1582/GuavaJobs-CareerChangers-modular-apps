import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../auth/auth.types';
import { PdfService } from '../pdf/pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createManualApplicationSchema,
  CreateManualApplicationInput,
  generateApplicationSchema,
  GenerateApplicationInput,
  listApplicationsQuerySchema,
  ListApplicationsQuery,
  patchApplicationSchema,
  PatchApplicationInput,
  hybridCoverLetterSchema,
  hybridGenerateCvSchema,
} from '../shared/schemas/application.schema';
import {
  addressGapSchema,
  AddressGapInput,
} from '../shared/schemas/career-cv.schema';
import { AppError } from '../shared/schemas/error.schema';
import { CareerCvService } from '../profiles/career-cv.service';
import { ApplicationGenerateService } from './application-generate.service';
import { ApplicationManualService } from './application-manual.service';
import { ApplicationsService } from './applications.service';

@ApiTags('applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applications: ApplicationsService,
    private readonly generateService: ApplicationGenerateService,
    private readonly manualService: ApplicationManualService,
    private readonly careerCv: CareerCvService,
    private readonly pdf: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List applications with optional filters' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listApplicationsQuerySchema))
    query: ListApplicationsQuery,
  ) {
    return this.applications.list(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create manual application (spreadsheet-style)' })
  createManual(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createManualApplicationSchema))
    body: CreateManualApplicationInput,
  ) {
    return this.manualService.create(user.id, body);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Enqueue AI application package (async)' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  async generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(generateApplicationSchema))
    body: GenerateApplicationInput,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.generateService.generate(
      user.id,
      body,
      idempotencyKey,
    );
    res.status(result.statusCode);
    return result.body;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Application detail — poll generationStatus until COMPLETED' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.applications.getById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update status, normalized fields, or cover letter' })
  patch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(patchApplicationSchema)) body: PatchApplicationInput,
  ) {
    return this.applications.patch(user.id, id, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Permanently delete application (cascades ATS report, tailored CV, events; profile kept)',
  })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.applications.remove(user.id, id);
  }

  @Post(':id/regenerate')
  @HttpCode(202)
  @ApiOperation({ summary: 'Enqueue AI regenerate (async overwrite)' })
  regenerate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.generateService.regenerate(user.id, id);
  }

  @Post(':id/generate-cover-letter')
  @HttpCode(202)
  @ApiOperation({ summary: 'Manual hybrid — AI cover letter from pasted JD' })
  hybridCoverLetter(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(hybridCoverLetterSchema)) body: { pastedJobDescription?: string },
  ) {
    return this.manualService.generateCoverLetter(
      user.id,
      id,
      body.pastedJobDescription,
    );
  }

  @Post(':id/generate-ats-report')
  @HttpCode(202)
  @ApiOperation({ summary: 'Manual hybrid — optional AI ATS report' })
  hybridAts(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.manualService.generateAtsReport(user.id, id);
  }

  @Post(':id/gaps/address')
  @ApiOperation({
    summary:
      'Address an ATS gap — save fact to master career corpus (no LLM); marks ATS stale',
  })
  addressGap(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addressGapSchema)) body: AddressGapInput,
  ) {
    return this.careerCv.addressGap(user.id, id, body);
  }

  @Post(':id/generate-cv')
  @HttpCode(202)
  @ApiOperation({
    summary: 'On-demand tailored CV JSON from job description (AI or manual)',
  })
  hybridGenerateCv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(hybridGenerateCvSchema))
    body: { pastedJobDescription?: string },
  ) {
    return this.manualService.generateCv(user.id, id, body.pastedJobDescription);
  }

  @Get(':id/generated-cv/json')
  @ApiOperation({ summary: 'Download hydrated generated CV JSON attachment' })
  async generatedCvJson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const payload = await this.applications.getHydratedGeneratedCvExport(
      user.id,
      id,
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="generated-cv-${id}.json"`,
    );
    res.send(JSON.stringify(payload, null, 2));
  }

  @Post(':id/cover-letter/pdf')
  @ApiOperation({ summary: 'Stream cover letter PDF (never stored)' })
  async coverLetterPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const app = await this.prisma.application.findFirst({
      where: { id, userId: user.id },
      include: { user: true },
    });
    if (!app?.coverLetterContent) {
      throw new AppError(
        'COVER_LETTER_MISSING',
        'No cover letter content on this application',
        400,
      );
    }

    const buffer = await this.pdf.coverLetterPdf({
      applicantName: app.user.name,
      coverLetter: app.coverLetterContent,
      companyName: app.companyName ?? undefined,
      jobTitle: app.jobRoleTitle ?? undefined,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="cover-letter-${id}.pdf"`,
    );
    res.send(buffer);
  }
}
