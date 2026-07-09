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
exports.ApplicationManualService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_constants_1 = require("../queue/queue.constants");
const error_schema_1 = require("../shared/schemas/error.schema");
const usage_service_1 = require("../users/usage.service");
const application_mapper_1 = require("./application.mapper");
let ApplicationManualService = class ApplicationManualService {
    prisma;
    usage;
    aiQueue;
    constructor(prisma, usage, aiQueue) {
        this.prisma = prisma;
        this.usage = usage;
        this.aiQueue = aiQueue;
    }
    create(userId, input) {
        return this.prisma.profile
            .findFirst({ where: { id: input.profileId, userId } })
            .then((profile) => {
            if (!profile) {
                throw new error_schema_1.AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
            }
            return this.prisma.application.create({
                data: {
                    userId,
                    profileId: input.profileId,
                    status: input.status ?? client_1.ApplicationStatus.DRAFT,
                    generationMode: client_1.ApplicationGenerationMode.MANUAL,
                    companyName: input.companyName,
                    jobRoleTitle: input.jobRoleTitle,
                    jobLocation: input.jobLocation,
                    jobWebsite: input.jobWebsite,
                    industry: input.industry,
                    sourceOfListing: input.sourceOfListing,
                    languageRequired: input.languageRequired ?? [],
                    jobStartDate: input.jobStartDate
                        ? new Date(input.jobStartDate)
                        : undefined,
                    jobSalaryMin: input.jobSalaryMin,
                    jobSalaryMax: input.jobSalaryMax,
                    jobSalaryCurrency: input.jobSalaryCurrency,
                    jobSalaryPeriod: input.jobSalaryPeriod,
                    jobSalaryRaw: input.jobSalaryRaw,
                    userFitRating: input.userFitRating,
                    applyUrl: input.applyUrl,
                    pastedJobDescription: input.pastedJobDescription,
                },
                include: { atsReport: true },
            });
        })
            .then((app) => (0, application_mapper_1.toApplicationResponse)(app));
    }
    async generateCoverLetter(userId, applicationId, pastedJobDescription) {
        await this.usage.assertCanGenerateAi(userId);
        const app = await this.findManual(userId, applicationId);
        if (pastedJobDescription) {
            await this.prisma.application.update({
                where: { id: applicationId },
                data: { pastedJobDescription },
            });
        }
        await this.prisma.application.update({
            where: { id: applicationId },
            data: {
                generationStatus: client_1.ApplicationGenerationStatus.PENDING,
                generationError: null,
            },
        });
        await this.aiQueue.add('hybrid-cover-letter', { type: 'hybrid-cover-letter', applicationId, userId }, {
            jobId: `hybrid-cl-${applicationId}-${Date.now()}`,
            attempts: 2,
        });
        return (0, application_mapper_1.toApplicationResponse)(await this.prisma.application.findFirstOrThrow({
            where: { id: applicationId },
            include: { atsReport: true },
        }));
    }
    async generateAtsReport(userId, applicationId) {
        await this.usage.assertCanGenerateAi(userId);
        await this.findManual(userId, applicationId);
        await this.prisma.application.update({
            where: { id: applicationId },
            data: {
                generationStatus: client_1.ApplicationGenerationStatus.PENDING,
                generationError: null,
            },
        });
        await this.aiQueue.add('hybrid-ats-report', { type: 'hybrid-ats-report', applicationId, userId }, {
            jobId: `hybrid-ats-${applicationId}-${Date.now()}`,
            attempts: 2,
        });
        return (0, application_mapper_1.toApplicationResponse)(await this.prisma.application.findFirstOrThrow({
            where: { id: applicationId },
            include: { atsReport: true },
        }));
    }
    async findManual(userId, applicationId) {
        const app = await this.prisma.application.findFirst({
            where: { id: applicationId, userId },
        });
        if (!app) {
            throw new error_schema_1.AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
        }
        if (app.generationMode !== client_1.ApplicationGenerationMode.MANUAL) {
            throw new error_schema_1.AppError('INVALID_OPERATION', 'Hybrid AI endpoints require MANUAL applications', 400);
        }
        return app;
    }
};
exports.ApplicationManualService = ApplicationManualService;
exports.ApplicationManualService = ApplicationManualService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)(queue_constants_1.AI_GENERATION_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        usage_service_1.UsageService,
        bullmq_2.Queue])
], ApplicationManualService);
//# sourceMappingURL=application-manual.service.js.map