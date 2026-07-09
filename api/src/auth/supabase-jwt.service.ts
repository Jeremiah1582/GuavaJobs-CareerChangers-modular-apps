import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTVerifyResult } from 'jose';
import { EnvConfig } from '../config/env.validation';
import { AppError } from '../shared/schemas/error.schema';
import { JwtClaims } from './auth.types';

@Injectable()
export class SupabaseJwtService implements OnModuleInit {
  private jwks!: ReturnType<typeof createRemoteJWKSet>;
  private issuer!: string;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  onModuleInit() {
    const jwksUrl = this.config.get('SUPABASE_JWKS_URL', { infer: true });
    const supabaseUrl = this.config.get('SUPABASE_URL', { infer: true });
    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
    this.issuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;
  }

  async verifyAccessToken(token: string): Promise<JWTVerifyResult<JwtClaims>> {
    try {
      return await jwtVerify<JwtClaims>(token, this.jwks, {
        issuer: this.issuer,
      });
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired access token', 401);
    }
  }
}
