import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { SupabaseJwtService } from './supabase-jwt.service';
export declare class SupabaseAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly jwt;
    private readonly authService;
    constructor(reflector: Reflector, jwt: SupabaseJwtService, authService: AuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
