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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const error_schema_1 = require("../shared/schemas/error.schema");
const application_mapper_1 = require("./application.mapper");
let ApplicationsService = class ApplicationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(userId, query) {
        const where = {
            userId,
            ...(query.status ? { status: query.status } : {}),
            ...(query.sourceOfListing
                ? { sourceOfListing: query.sourceOfListing }
                : {}),
            ...(query.companyName
                ? { companyName: { contains: query.companyName, mode: 'insensitive' } }
                : {}),
        };
        const apps = await this.prisma.application.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: { atsReport: true },
        });
        return apps.map((a) => (0, application_mapper_1.toApplicationResponse)(a));
    }
    async getById(userId, applicationId) {
        const app = await this.prisma.application.findFirst({
            where: { id: applicationId, userId },
            include: { atsReport: true, events: { orderBy: { occurredAt: 'desc' } } },
        });
        if (!app) {
            throw new error_schema_1.AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
        }
        return (0, application_mapper_1.toApplicationResponse)(app, true);
    }
    async patch(userId, applicationId, input) {
        await this.assertOwned(userId, applicationId);
        const data = {
            ...input,
            jobStartDate: input.jobStartDate === undefined
                ? undefined
                : input.jobStartDate
                    ? new Date(input.jobStartDate)
                    : null,
            appliedAt: input.appliedAt === undefined
                ? undefined
                : input.appliedAt
                    ? new Date(input.appliedAt)
                    : null,
        };
        if (input.coverLetterContent !== undefined) {
            data.coverLetterEdited = input.coverLetterEdited ?? true;
        }
        const app = await this.prisma.application.update({
            where: { id: applicationId },
            data,
            include: { atsReport: true },
        });
        return (0, application_mapper_1.toApplicationResponse)(app);
    }
    async assertOwned(userId, applicationId) {
        const app = await this.prisma.application.findFirst({
            where: { id: applicationId, userId },
        });
        if (!app) {
            throw new error_schema_1.AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
        }
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map