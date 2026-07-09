"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseJwtService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jose_1 = require("jose");
const error_schema_1 = require("../shared/schemas/error.schema");
let SupabaseJwtService = class SupabaseJwtService {
    config;
    jwks;
    issuer;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const jwksUrl = this.config.get('SUPABASE_JWKS_URL', { infer: true });
        const supabaseUrl = this.config.get('SUPABASE_URL', { infer: true });
        this.jwks = (0, jose_1.createRemoteJWKSet)(new URL(jwksUrl));
        this.issuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;
    }
    async verifyAccessToken(token) {
        try {
            return await (0, jose_1.jwtVerify)(token, this.jwks, {
                issuer: this.issuer,
            });
        }
        catch {
            throw new error_schema_1.AppError('UNAUTHORIZED', 'Invalid or expired access token', 401);
        }
    }
};
exports.SupabaseJwtService = SupabaseJwtService;
exports.SupabaseJwtService = SupabaseJwtService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseJwtService);
//# sourceMappingURL=supabase-jwt.service.js.map