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
exports.AutofillService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const error_schema_1 = require("../shared/schemas/error.schema");
const job_schema_1 = require("../shared/schemas/job.schema");
const autofill_util_1 = require("./autofill.util");
const CV_STAGING_HINT = 'CV files cannot be attached by autofill. Download your CV using downloadPath, then tap the employer file picker to attach it manually.';
const DISCLAIMERS = [
    'Review every filled field before submitting on the employer site.',
    'GuavaJobs never submits applications on your behalf.',
    'Screening and demographic questions are only filled when you saved an explicit answer.',
];
let AutofillService = class AutofillService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPayload(userId, applicationId) {
        const application = await this.prisma.application.findFirst({
            where: { id: applicationId, userId },
            include: {
                user: true,
                profile: true,
            },
        });
        if (!application) {
            throw new error_schema_1.AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
        }
        const detected = (0, autofill_util_1.detectAtsType)(application.canonicalJobKey, application.applyUrl);
        const atsType = job_schema_1.atsTypeSchema.safeParse(detected).success
            ? detected
            : 'unknown';
        const fieldMap = (0, autofill_util_1.getFieldMapForAts)(detected);
        const values = (0, autofill_util_1.buildAutofillValues)({
            user: application.user,
            profile: application.profile,
            application,
        });
        return {
            applicationId: application.id,
            profileId: application.profileId,
            applyUrl: application.applyUrl,
            atsType,
            atsSupported: fieldMap !== null,
            fieldMap,
            values,
            coverLetterContent: application.coverLetterContent,
            cvStaging: {
                hint: CV_STAGING_HINT,
                downloadPath: `/api/v1/profiles/${application.profileId}/cv/download`,
            },
            disclaimers: DISCLAIMERS,
        };
    }
};
exports.AutofillService = AutofillService;
exports.AutofillService = AutofillService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AutofillService);
//# sourceMappingURL=autofill.service.js.map