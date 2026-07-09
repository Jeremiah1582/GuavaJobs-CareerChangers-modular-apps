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
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const zod_validation_pipe_1 = require("../common/pipes/zod-validation.pipe");
const job_schema_1 = require("../shared/schemas/job.schema");
const jobs_service_1 = require("./jobs.service");
let JobsController = class JobsController {
    jobsService;
    constructor(jobsService) {
        this.jobsService = jobsService;
    }
    search(query) {
        return this.jobsService.search(query);
    }
    getByKey(canonicalKey, expand) {
        return this.jobsService.getByCanonicalKey(canonicalKey, {
            expandAts: expand === 'ats',
        });
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search jobs via Adzuna with ATS enrichment' }),
    __param(0, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(job_schema_1.jobSearchQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':canonicalKey'),
    (0, swagger_1.ApiOperation)({
        summary: 'Job detail by canonical key (URL-encode colons as %3A). Use ?expand=ats to fetch employer ATS description when available.',
    }),
    __param(0, (0, common_1.Param)('canonicalKey')),
    __param(1, (0, common_1.Query)('expand')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "getByKey", null);
exports.JobsController = JobsController = __decorate([
    (0, swagger_1.ApiTags)('jobs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map