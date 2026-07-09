import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JWTVerifyResult } from 'jose';
import { EnvConfig } from '../config/env.validation';
import { JwtClaims } from './auth.types';
export declare class SupabaseJwtService implements OnModuleInit {
    private readonly config;
    private jwks;
    private issuer;
    constructor(config: ConfigService<EnvConfig, true>);
    onModuleInit(): void;
    verifyAccessToken(token: string): Promise<JWTVerifyResult<JwtClaims>>;
}
