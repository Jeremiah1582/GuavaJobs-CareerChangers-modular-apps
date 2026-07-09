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
exports.ApplicationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const zod_validation_pipe_1 = require("../common/pipes/zod-validation.pipe");
const pdf_service_1 = require("../pdf/pdf.service");
const prisma_service_1 = require("../prisma/prisma.service");
const application_schema_1 = require("../shared/schemas/application.schema");
const error_schema_1 = require("../shared/schemas/error.schema");
const application_generate_service_1 = require("./application-generate.service");
const application_manual_service_1 = require("./application-manual.service");
const applications_service_1 = require("./applications.service");
let ApplicationsController = class ApplicationsController {
    applications;
    generateService;
    manualService;
    pdf;
    prisma;
    constructor(applications, generateService, manualService, pdf, prisma) {
        this.applications = applications;
        this.generateService = generateService;
        this.manualService = manualService;
        this.pdf = pdf;
        this.prisma = prisma;
    }
    list(user, query) {
        return this.applications.list(user.id, query);
    }
    createManual(user, body) {
        return this.manualService.create(user.id, body);
    }
    async generate(user, body, idempotencyKey, res) {
        const result = await this.generateService.generate(user.id, body, idempotencyKey);
        res.status(result.statusCode);
        return result.body;
    }
    getById(user, id) {
        return this.applications.getById(user.id, id);
    }
    patch(user, id, body) {
        return this.applications.patch(user.id, id, body);
    }
    regenerate(user, id) {
        return this.generateService.regenerate(user.id, id);
    }
    hybridCoverLetter(user, id, body) {
        return this.manualService.generateCoverLetter(user.id, id, body.pastedJobDescription);
    }
    hybridAts(user, id) {
        return this.manualService.generateAtsReport(user.id, id);
    }
    async coverLetterPdf(user, id, res) {
        const app = await this.prisma.application.findFirst({
            where: { id, userId: user.id },
            include: { user: true },
        });
        if (!app?.coverLetterContent) {
            throw new error_schema_1.AppError('COVER_LETTER_MISSING', 'No cover letter content on this application', 400);
        }
        const buffer = await this.pdf.coverLetterPdf({
            applicantName: app.user.name,
            coverLetter: app.coverLetterContent,
            companyName: app.companyName ?? undefined,
            jobTitle: app.jobRoleTitle ?? undefined,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="cover-letter-${id}.pdf"`);
        res.send(buffer);
    }
};
exports.ApplicationsController = ApplicationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List applications with optional filters' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(application_schema_1.listApplicationsQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create manual application (spreadsheet-style)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(application_schema_1.createManualApplicationSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "createManual", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({ summary: 'Enqueue AI application package (async)' }),
    (0, swagger_1.ApiHeader)({ name: 'Idempotency-Key', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(application_schema_1.generateApplicationSchema))),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Application detail — poll generationStatus until COMPLETED' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update status, normalized fields, or cover letter' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(application_schema_1.patchApplicationSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "patch", null);
__decorate([
    (0, common_1.Post)(':id/regenerate'),
    (0, common_1.HttpCode)(202),
    (0, swagger_1.ApiOperation)({ summary: 'Enqueue AI regenerate (async overwrite)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "regenerate", null);
__decorate([
    (0, common_1.Post)(':id/generate-cover-letter'),
    (0, common_1.HttpCode)(202),
    (0, swagger_1.ApiOperation)({ summary: 'Manual hybrid — AI cover letter from pasted JD' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(application_schema_1.hybridCoverLetterSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "hybridCoverLetter", null);
__decorate([
    (0, common_1.Post)(':id/generate-ats-report'),
    (0, common_1.HttpCode)(202),
    (0, swagger_1.ApiOperation)({ summary: 'Manual hybrid — optional AI ATS report' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "hybridAts", null);
__decorate([
    (0, common_1.Post)(':id/cover-letter/pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Stream cover letter PDF (never stored)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "coverLetterPdf", null);
exports.ApplicationsController = ApplicationsController = __decorate([
    (0, swagger_1.ApiTags)('applications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('applications'),
    __metadata("design:paramtypes", [applications_service_1.ApplicationsService,
        application_generate_service_1.ApplicationGenerateService,
        application_manual_service_1.ApplicationManualService,
        pdf_service_1.PdfService,
        prisma_service_1.PrismaService])
], ApplicationsController);
//# sourceMappingURL=applications.controller.js.map