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
exports.UsageService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const error_schema_1 = require("../shared/schemas/error.schema");
const freemium_constants_1 = require("../shared/constants/freemium.constants");
let UsageService = class UsageService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getUsageSnapshot(tier, aiGenerationsUsedPeriod, usagePeriodStart) {
        const limit = tier === client_1.UserTier.FREE ? freemium_constants_1.FREE_AI_GENERATIONS_PER_MONTH : null;
        return {
            tier,
            aiGenerationsUsedPeriod,
            aiGenerationsLimit: limit,
            usagePeriodStart,
        };
    }
    async assertCanGenerateAi(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        const rolled = await this.rolloverIfNeeded(user.id, user.usagePeriodStart);
        if (user.tier === client_1.UserTier.PAID) {
            return;
        }
        if (rolled.aiGenerationsUsedPeriod >= freemium_constants_1.FREE_AI_GENERATIONS_PER_MONTH) {
            throw new error_schema_1.AppError('QUOTA_EXCEEDED', `Free tier limit of ${freemium_constants_1.FREE_AI_GENERATIONS_PER_MONTH} AI generations per month reached`, 402);
        }
    }
    async incrementAiUsage(userId) {
        await this.rolloverIfNeeded(userId, null);
        await this.prisma.user.update({
            where: { id: userId },
            data: { aiGenerationsUsedPeriod: { increment: 1 } },
        });
    }
    async rolloverIfNeeded(userId, usagePeriodStart) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        const start = usagePeriodStart ?? user.usagePeriodStart;
        const now = new Date();
        if (!start || monthsElapsed(start, now) >= 1) {
            return this.prisma.user.update({
                where: { id: userId },
                data: {
                    aiGenerationsUsedPeriod: 0,
                    usagePeriodStart: now,
                },
            });
        }
        return user;
    }
};
exports.UsageService = UsageService;
exports.UsageService = UsageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsageService);
function monthsElapsed(from, to) {
    return ((to.getFullYear() - from.getFullYear()) * 12 +
        (to.getMonth() - from.getMonth()));
}
//# sourceMappingURL=usage.service.js.map