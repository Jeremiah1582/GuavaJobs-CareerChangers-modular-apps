"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobFactsParser = void 0;
const common_1 = require("@nestjs/common");
let JobFactsParser = class JobFactsParser {
    parseFromJob(job) {
        return {
            companyName: job.company || null,
            jobRoleTitle: job.title || null,
            jobLocation: job.location,
            jobWebsite: null,
            industry: null,
            sourceOfListing: 'Adzuna',
            languageRequired: [],
            jobSalaryMin: job.salaryMin ?? null,
            jobSalaryMax: job.salaryMax ?? null,
            jobSalaryCurrency: job.salaryCurrency ?? null,
            jobSalaryPeriod: null,
            jobSalaryRaw: job.salaryMin || job.salaryMax
                ? `${job.salaryMin ?? ''}-${job.salaryMax ?? ''} ${job.salaryCurrency ?? ''}`.trim()
                : null,
        };
    }
    parseFromFreeText(description, overrides) {
        const languages = extractLanguages(description);
        return {
            companyName: overrides?.companyName ?? null,
            jobRoleTitle: overrides?.jobRoleTitle ?? null,
            jobLocation: overrides?.jobLocation ?? null,
            jobWebsite: overrides?.jobWebsite ?? null,
            industry: overrides?.industry ?? null,
            sourceOfListing: overrides?.sourceOfListing ?? 'Manual',
            languageRequired: overrides?.languageRequired ?? languages,
            jobSalaryMin: overrides?.jobSalaryMin ?? null,
            jobSalaryMax: overrides?.jobSalaryMax ?? null,
            jobSalaryCurrency: overrides?.jobSalaryCurrency ?? null,
            jobSalaryPeriod: overrides?.jobSalaryPeriod ?? null,
            jobSalaryRaw: overrides?.jobSalaryRaw ?? null,
        };
    }
};
exports.JobFactsParser = JobFactsParser;
exports.JobFactsParser = JobFactsParser = __decorate([
    (0, common_1.Injectable)()
], JobFactsParser);
function extractLanguages(text) {
    const found = new Set();
    const patterns = [
        /\b(english|french|german|spanish|dutch|italian|portuguese)\b/gi,
    ];
    for (const pattern of patterns) {
        for (const match of text.matchAll(pattern)) {
            if (match[1]) {
                found.add(match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase());
            }
        }
    }
    return [...found];
}
//# sourceMappingURL=job-facts.parser.js.map