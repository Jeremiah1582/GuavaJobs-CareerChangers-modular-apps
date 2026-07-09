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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const error_schema_1 = require("../shared/schemas/error.schema");
const DEFAULT_PROFILE_TITLE = 'Default';
const DEFAULT_JOB_TITLE = 'Job Seeker';
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    claimsToAuthUser(claims) {
        const email = claims.email;
        if (!email) {
            throw new error_schema_1.AppError('UNAUTHORIZED', 'JWT missing email claim', 401);
        }
        const meta = claims.user_metadata ?? {};
        const name = meta.full_name?.trim() ||
            meta.name?.trim() ||
            email.split('@')[0] ||
            'User';
        return {
            id: claims.sub,
            email,
            name,
            imgUrl: meta.avatar_url ?? null,
        };
    }
    async syncUser(authUser) {
        const byId = await this.prisma.user.findUnique({
            where: { id: authUser.id },
        });
        if (byId) {
            const user = await this.prisma.user.update({
                where: { id: authUser.id },
                data: {
                    email: authUser.email,
                    name: authUser.name,
                    ...(authUser.imgUrl !== null ? { imgUrl: authUser.imgUrl } : {}),
                },
            });
            await this.ensureDefaultProfile(user.id);
            return user;
        }
        const byEmail = await this.prisma.user.findUnique({
            where: { email: authUser.email },
        });
        if (byEmail) {
            const user = await this.rekeyUser(byEmail.id, authUser);
            await this.ensureDefaultProfile(user.id);
            return user;
        }
        const user = await this.prisma.user.create({
            data: {
                id: authUser.id,
                email: authUser.email,
                name: authUser.name,
                imgUrl: authUser.imgUrl,
            },
        });
        await this.ensureDefaultProfile(user.id);
        return user;
    }
    async rekeyUser(oldId, authUser) {
        const old = await this.prisma.user.findUniqueOrThrow({
            where: { id: oldId },
        });
        return this.prisma.$transaction(async (tx) => {
            const tempEmail = `rekey-${authUser.id}@internal.guavajobs.local`;
            await tx.user.update({
                where: { id: oldId },
                data: { email: tempEmail },
            });
            const user = await tx.user.create({
                data: {
                    id: authUser.id,
                    email: authUser.email,
                    name: authUser.name,
                    imgUrl: authUser.imgUrl,
                    tier: old.tier,
                    aiGenerationsUsedPeriod: old.aiGenerationsUsedPeriod,
                    usagePeriodStart: old.usagePeriodStart,
                    linkedinUrl: old.linkedinUrl,
                    githubUrl: old.githubUrl,
                    metadata: old.metadata ?? undefined,
                },
            });
            await tx.application.updateMany({
                where: { userId: oldId },
                data: { userId: authUser.id },
            });
            await tx.profile.updateMany({
                where: { userId: oldId },
                data: { userId: authUser.id },
            });
            await tx.user.delete({ where: { id: oldId } });
            return user;
        });
    }
    async ensureDefaultProfile(userId) {
        const profileCount = await this.prisma.profile.count({
            where: { userId },
        });
        if (profileCount === 0) {
            await this.prisma.profile.create({
                data: {
                    userId,
                    profileTitle: DEFAULT_PROFILE_TITLE,
                    jobTitle: DEFAULT_JOB_TITLE,
                    seniority: client_1.SeniorityLevel.JUNIOR,
                    primaryIndustry: client_1.ProfileIndustry.OTHER,
                    isDefault: true,
                },
            });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map