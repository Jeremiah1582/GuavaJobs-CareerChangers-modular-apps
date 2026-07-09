import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { AppError } from '../shared/schemas/error.schema';
import { AuthService } from './auth.service';
import { SupabaseJwtService } from './supabase-jwt.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: SupabaseJwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'Missing Bearer token', 401);
    }

    const token = header.slice('Bearer '.length).trim();
    const { payload } = await this.jwt.verifyAccessToken(token);
    const authUser = this.authService.claimsToAuthUser(payload);
    await this.authService.syncUser(authUser);
    (request as Request & { user: typeof authUser }).user = authUser;
    return true;
  }
}
