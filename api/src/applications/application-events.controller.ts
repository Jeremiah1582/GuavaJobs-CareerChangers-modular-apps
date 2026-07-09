import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  createApplicationEventSchema,
  CreateApplicationEventInput,
  listEventsQuerySchema,
  ListEventsQuery,
  patchApplicationEventSchema,
  PatchApplicationEventInput,
} from '../shared/schemas/application-event.schema';
import { ApplicationEventsService } from './application-events.service';

@ApiTags('application-events')
@ApiBearerAuth()
@Controller('applications/:applicationId/events')
export class ApplicationEventsController {
  constructor(private readonly events: ApplicationEventsService) {}

  @Get()
  @ApiOperation({ summary: 'List application events' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId') applicationId: string,
    @Query(new ZodValidationPipe(listEventsQuerySchema)) query: ListEventsQuery,
  ) {
    return this.events.list(user.id, applicationId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create NOTE / NEXT_STEP / INTERVIEW / RESPONSE' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId') applicationId: string,
    @Body(new ZodValidationPipe(createApplicationEventSchema))
    body: CreateApplicationEventInput,
  ) {
    return this.events.create(user.id, applicationId, body);
  }

  @Patch(':eventId')
  @ApiOperation({ summary: 'Update event' })
  patch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId') applicationId: string,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(patchApplicationEventSchema))
    body: PatchApplicationEventInput,
  ) {
    return this.events.patch(user.id, applicationId, eventId, body);
  }

  @Delete(':eventId')
  @ApiOperation({ summary: 'Delete event' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId') applicationId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.events.remove(user.id, applicationId, eventId);
  }
}
