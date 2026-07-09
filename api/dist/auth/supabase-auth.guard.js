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
exports.SupabaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../common/decorators/public.decorator");
const error_schema_1 = require("../shared/schemas/error.schema");
const auth_service_1 = require("./auth.service");
const supabase_jwt_service_1 = require("./supabase-jwt.service");
let SupabaseAuthGuard = class SupabaseAuthGuard {
    reflector;
    jwt;
    authService;
    constructor(reflector, jwt, authService) {
        this.reflector = reflector;
        this.jwt = jwt;
        this.authService = authService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const header = request.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            throw new error_schema_1.AppError('UNAUTHORIZED', 'Missing Bearer token', 401);
        }
        const token = header.slice('Bearer '.length).trim();
        const { payload } = await this.jwt.verifyAccessToken(token);
        const authUser = this.authService.claimsToAuthUser(payload);
        await this.authService.syncUser(authUser);
        request.user = authUser;
        return true;
    }
};
exports.SupabaseAuthGuard = SupabaseAuthGuard;
exports.SupabaseAuthGuard = SupabaseAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        supabase_jwt_service_1.SupabaseJwtService,
        auth_service_1.AuthService])
], SupabaseAuthGuard);
//# sourceMappingURL=supabase-auth.guard.js.map