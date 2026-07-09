"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const adzuna_client_1 = require("./adzuna/adzuna.client");
const adzuna_rate_limit_service_1 = require("./adzuna/adzuna-rate-limit.service");
const job_cache_service_1 = require("./cache/job-cache.service");
const ashby_adapter_1 = require("./ats/adapters/ashby.adapter");
const greenhouse_adapter_1 = require("./ats/adapters/greenhouse.adapter");
const lever_adapter_1 = require("./ats/adapters/lever.adapter");
const ats_enrichment_service_1 = require("./ats/ats-enrichment.service");
const ats_resolver_service_1 = require("./ats/ats-resolver.service");
const jobs_controller_1 = require("./jobs.controller");
const jobs_service_1 = require("./jobs.service");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        controllers: [jobs_controller_1.JobsController],
        providers: [
            jobs_service_1.JobsService,
            adzuna_client_1.AdzunaClient,
            adzuna_rate_limit_service_1.AdzunaRateLimitService,
            job_cache_service_1.JobCacheService,
            ats_resolver_service_1.AtsResolverService,
            ats_enrichment_service_1.AtsEnrichmentService,
            greenhouse_adapter_1.GreenhouseAdapter,
            lever_adapter_1.LeverAdapter,
            ashby_adapter_1.AshbyAdapter,
        ],
        exports: [jobs_service_1.JobsService, job_cache_service_1.JobCacheService],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map