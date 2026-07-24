import { SetMetadata } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restrict route to users with one of the given platform roles. */
export const Roles = (...roles: PlatformRole[]) => SetMetadata(ROLES_KEY, roles);
