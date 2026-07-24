import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformRole } from '@prisma/client';
import { z } from 'zod';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  adminUsersListQuerySchema,
  patchUserRoleBodySchema,
  PatchUserRoleBody,
} from '../shared/schemas/admin.schema';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('engagement/summary')
  @Roles(PlatformRole.ADMIN, PlatformRole.OWNER)
  @ApiOperation({ summary: 'Engagement KPIs for admin dashboard (ADMIN+)' })
  getEngagementSummary() {
    return this.admin.getEngagementSummary();
  }

  @Get('engagement/users')
  @Roles(PlatformRole.ADMIN, PlatformRole.OWNER)
  @ApiOperation({
    summary: 'Paginated sanitized user list for engagement (ADMIN+, no PII)',
  })
  listEngagementUsers(
    @Query(new ZodValidationPipe(adminUsersListQuerySchema))
    query: z.infer<typeof adminUsersListQuerySchema>,
  ) {
    return this.admin.listEngagementUsers(query);
  }

  @Get('users')
  @Roles(PlatformRole.OWNER)
  @ApiOperation({
    summary: 'Paginated user list with email for role management (OWNER)',
  })
  listOwnerUsers(
    @Query(new ZodValidationPipe(adminUsersListQuerySchema))
    query: z.infer<typeof adminUsersListQuerySchema>,
  ) {
    return this.admin.listOwnerUsers(query);
  }

  @Patch('users/:id/role')
  @Roles(PlatformRole.OWNER)
  @ApiOperation({ summary: 'Promote/demote platform role (OWNER)' })
  patchUserRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') targetUserId: string,
    @Body(new ZodValidationPipe(patchUserRoleBodySchema)) body: PatchUserRoleBody,
  ) {
    return this.admin.patchUserRole(actor.id, targetUserId, body);
  }
}
