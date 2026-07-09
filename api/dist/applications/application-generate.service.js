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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationGenerateService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bullmq_2 = require("bullmq");
const jobs_service_1 = require("../jobs/jobs.service");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_constants_1 = require("../queue/queue.constants");
const error_schema_1 = require("../shared/schemas/error.schema");
const usage_service_1 = require("../users/usage.service");
const application_mapper_1 = require("./application.mapper");
const idempotency_service_1 = require("./idempotency.service");
let ApplicationGenerateService = class ApplicationGenerateService {
    prisma;
    jobs;
    usage;
    idempotency;
    aiQueue;
    constructor(prisma, jobs, usage, idempotency, aiQueue) {
        this.prisma = prisma;
        this.jobs = jobs;
        this.usage = usage;
        this.idempotency = idempotency;
        this.aiQueue = aiQueue;
    }
    async generate(userId, input, idempotencyKey) {
        if (idempotencyKey) {
            const existingId = await this.idempotency.getExistingApplicationId(userId, idempotencyKey);
            if (existingId) {
                const existing = await this.getOwnedApplication(userId, existingId);
                return { statusCode: 202, body: (0, application_mapper_1.toApplicationResponse)(existing) };
            }
        }
        await this.usage.assertCanGenerateAi(userId);
        const profile = await this.prisma.profile.findFirst({
            where: { id: input.profileId, userId },
            include: { currentCv: true },
        });
        if (!profile) {
            throw new error_schema_1.AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
        }
        if (!profile.currentCv?.parsedText) {
            throw new error_schema_1.AppError('CV_REQUIRED', 'Upload and parse a CV first', 400);
        }
        const canonicalJobKey = input.canonicalJobKey.toLowerCase();
        await this.jobs.getByCanonicalKey(canonicalJobKey);
        const duplicate = await this.prisma.application.findFirst({
            where: { userId, canonicalJobKey },
            include: { atsReport: true },
        });
        if (duplicate) {
            return { statusCode: 200, body: (0, application_mapper_1.toApplicationResponse)(duplicate) };
        }
        const application = await this.prisma.application.create({
            data: {
                userId,
                profileId: input.profileId,
                status: client_1.ApplicationStatus.DRAFT,
                generationMode: client_1.ApplicationGenerationMode.AI,
                canonicalJobKey,
                generationStatus: client_1.ApplicationGenerationStatus.PENDING,
            },
            include: { atsReport: true },
        });
        if (idempotencyKey) {
            await this.idempotency.bind(userId, idempotencyKey, application.id);
        }
        await this.enqueue({
            type: 'generate',
            applicationId: application.id,
            userId,
        });
        return { statusCode: 202, body: (0, application_mapper_1.toApplicationResponse)(application) };
    }
    async regenerate(userId, applicationId) {
        await this.usage.assertCanGenerateAi(userId);
        const app = await this.getOwnedApplication(userId, applicationId);
        if (app.generationMode !== client_1.ApplicationGenerationMode.AI) {
            throw new error_schema_1.AppError('INVALID_OPERATION', 'Regenerate is only for AI applications', 400);
        }
        await this.prisma.application.update({
            where: { id: applicationId },
            data: {
                generationStatus: client_1.ApplicationGenerationStatus.PENDING,
                generationError: null,
            },
        });
        await this.enqueue({
            type: 'regenerate',
            applicationId,
            userId,
        });
        const updated = await this.getOwnedApplication(userId, applicationId);
        return (0, application_mapper_1.toApplicationResponse)(updated);
    }
    async enqueue(data) {
        await this.aiQueue.add(data.type, data, {
            jobId: `${data.type}-${data.applicationId}-${Date.now()}`,
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 2,
            backoff: { type: 'exponential', delay: 3000 },
        });
    }
    async getOwnedApplication(userId, applicationId) {
        const app = await this.prisma.application.findFirst({
            where: { id: applicationId, userId },
            include: { atsReport: true },
        });
        if (!app) {
            throw new error_schema_1.AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
        }
        return app;
    }
};
exports.ApplicationGenerateService = ApplicationGenerateService;
exports.ApplicationGenerateService = ApplicationGenerateService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bullmq_1.InjectQueue)(queue_constants_1.AI_GENERATION_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jobs_service_1.JobsService,
        usage_service_1.UsageService,
        idempotency_service_1.IdempotencyService,
        bullmq_2.Queue])
], ApplicationGenerateService);
//# sourceMappingURL=application-generate.service.js.map