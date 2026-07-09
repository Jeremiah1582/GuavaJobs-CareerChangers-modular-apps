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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const error_schema_1 = require("../shared/schemas/error.schema");
const usage_service_1 = require("./usage.service");
let UsersService = class UsersService {
    prisma;
    usage;
    constructor(prisma, usage) {
        this.prisma = prisma;
        this.usage = usage;
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profiles: {
                    where: { isDefault: true },
                    take: 1,
                    select: {
                        id: true,
                        profileTitle: true,
                        jobTitle: true,
                        isDefault: true,
                    },
                },
            },
        });
        if (!user) {
            throw new error_schema_1.AppError('USER_NOT_FOUND', 'User not found', 404);
        }
        return this.toUserResponse(user);
    }
    async patchMe(userId, input) {
        await this.prisma.user.update({
            where: { id: userId },
            data: input,
        });
        return this.getMe(userId);
    }
    toUserResponse(user) {
        const defaultProfile = user.profiles[0] ?? null;
        const usage = this.usage.getUsageSnapshot(user.tier, user.aiGenerationsUsedPeriod, user.usagePeriodStart);
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            imgUrl: user.imgUrl,
            linkedinUrl: user.linkedinUrl,
            githubUrl: user.githubUrl,
            tier: user.tier,
            defaultProfileId: defaultProfile?.id ?? null,
            defaultProfile: defaultProfile
                ? {
                    id: defaultProfile.id,
                    profileTitle: defaultProfile.profileTitle,
                    jobTitle: defaultProfile.jobTitle,
                    isDefault: defaultProfile.isDefault,
                }
                : null,
            usage: {
                tier: usage.tier,
                aiGenerationsUsedPeriod: usage.aiGenerationsUsedPeriod,
                aiGenerationsLimit: usage.aiGenerationsLimit,
                usagePeriodStart: usage.usagePeriodStart?.toISOString() ?? null,
            },
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        usage_service_1.UsageService])
], UsersService);
//# sourceMappingURL=users.service.js.map