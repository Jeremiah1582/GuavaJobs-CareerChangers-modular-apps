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
var ApplicationAiWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationAiWorkerService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const ats_report_generator_1 = require("../ai/ats-report.generator");
const cover_letter_generator_1 = require("../ai/cover-letter.generator");
const job_facts_parser_1 = require("../ai/job-facts.parser");
const jobs_service_1 = require("../jobs/jobs.service");
const prisma_service_1 = require("../prisma/prisma.service");
const usage_service_1 = require("../users/usage.service");
const application_snapshot_service_1 = require("./application-snapshot.service");
let ApplicationAiWorkerService = ApplicationAiWorkerService_1 = class ApplicationAiWorkerService {
    prisma;
    jobs;
    snapshots;
    coverLetterGen;
    atsReportGen;
    jobFacts;
    usage;
    logger = new common_1.Logger(ApplicationAiWorkerService_1.name);
    constructor(prisma, jobs, snapshots, coverLetterGen, atsReportGen, jobFacts, usage) {
        this.prisma = prisma;
        this.jobs = jobs;
        this.snapshots = snapshots;
        this.coverLetterGen = coverLetterGen;
        this.atsReportGen = atsReportGen;
        this.jobFacts = jobFacts;
        this.usage = usage;
    }
    async process(job) {
        await this.prisma.application.update({
            where: { id: job.applicationId },
            data: { generationStatus: client_1.ApplicationGenerationStatus.PROCESSING },
        });
        try {
            switch (job.type) {
                case 'generate':
                    await this.runFullGenerate(job);
                    break;
                case 'regenerate':
                    await this.runRegenerate(job);
                    break;
                case 'hybrid-cover-letter':
                    await this.runHybridCoverLetter(job);
                    break;
                case 'hybrid-ats-report':
                    await this.runHybridAtsReport(job);
                    break;
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'AI generation failed';
            this.logger.error(`Job ${job.type} failed for ${job.applicationId}: ${message}`);
            await this.prisma.application.update({
                where: { id: job.applicationId },
                data: {
                    generationStatus: client_1.ApplicationGenerationStatus.FAILED,
                    generationError: message,
                },
            });
            throw error;
        }
    }
    async runFullGenerate(job) {
        const app = await this.prisma.application.findFirstOrThrow({
            where: { id: job.applicationId, userId: job.userId },
        });
        if (!app.canonicalJobKey) {
            throw new Error('Missing canonicalJobKey');
        }
        const jobData = await this.jobs.getByCanonicalKey(app.canonicalJobKey);
        const bundle = await this.snapshots.buildForGenerate(job.userId, app.profileId, app.id, jobData);
        const facts = this.jobFacts.parseFromJob(jobData);
        const cvText = String(bundle.cvSnapshot.parsedText ?? '');
        const coverLetter = await this.coverLetterGen.generate({
            jobTitle: jobData.title,
            companyName: jobData.company,
            jobDescription: jobData.description,
            profileSummary: bundle.profileSnapshot,
            cvText,
        });
        const ats = await this.atsReportGen.generate({
            jobTitle: jobData.title,
            companyName: jobData.company,
            jobDescription: jobData.description,
            coverLetter: coverLetter.coverLetter,
            cvText,
        });
        await this.prisma.$transaction(async (tx) => {
            await tx.application.update({
                where: { id: app.id },
                data: {
                    jobSnapshot: bundle.jobSnapshot,
                    profileSnapshot: bundle.profileSnapshot,
                    cvSnapshot: bundle.cvSnapshot,
                    cvStorageKey: bundle.cvStorageKey,
                    applyUrl: bundle.applyUrl,
                    snapshottedAt: new Date(),
                    coverLetterContent: coverLetter.coverLetter,
                    coverLetterSource: 'AI',
                    coverLetterEdited: false,
                    generationStatus: client_1.ApplicationGenerationStatus.COMPLETED,
                    generationError: null,
                    ...facts,
                },
            });
            await tx.applicationAtsReport.upsert({
                where: { applicationId: app.id },
                create: {
                    applicationId: app.id,
                    score: ats.score,
                    letterScore: ats.letterScore ?? null,
                    cvScore: ats.cvScore ?? null,
                    missingKeywords: ats.missingKeywords,
                    suggestions: ats.suggestions,
                    strengths: ats.strengths,
                    gaps: ats.gaps,
                    actionableSteps: ats.actionableSteps,
                    keywordCoverage: ats.keywordCoverage,
                    icpMatch: ats.icpMatch,
                    breakdown: ats.breakdown,
                    assessedAt: new Date(),
                },
                update: {
                    score: ats.score,
                    letterScore: ats.letterScore ?? null,
                    cvScore: ats.cvScore ?? null,
                    missingKeywords: ats.missingKeywords,
                    suggestions: ats.suggestions,
                    strengths: ats.strengths,
                    gaps: ats.gaps,
                    actionableSteps: ats.actionableSteps,
                    keywordCoverage: ats.keywordCoverage,
                    icpMatch: ats.icpMatch,
                    breakdown: ats.breakdown,
                    assessedAt: new Date(),
                },
            });
        });
        await this.usage.incrementAiUsage(job.userId);
    }
    async runRegenerate(job) {
        await this.runFullGenerate(job);
    }
    async runHybridCoverLetter(job) {
        const app = await this.prisma.application.findFirstOrThrow({
            where: { id: job.applicationId, userId: job.userId },
            include: { profile: { include: { currentCv: true } } },
        });
        if (app.generationMode !== client_1.ApplicationGenerationMode.MANUAL) {
            throw new Error('Hybrid cover letter requires MANUAL application');
        }
        const jd = app.pastedJobDescription?.trim() ||
            String(jsonField(app.jobSnapshot, 'description') ?? '');
        if (!jd) {
            throw new Error('pastedJobDescription is required');
        }
        const cvText = app.profile.currentCv?.parsedText ?? '';
        const coverLetter = await this.coverLetterGen.generate({
            jobTitle: app.jobRoleTitle ?? 'Role',
            companyName: app.companyName ?? 'Company',
            jobDescription: jd,
            profileSummary: {
                jobTitle: app.profile.jobTitle,
                summary: app.profile.summary,
                skills: app.profile.skills,
            },
            cvText,
        });
        await this.prisma.application.update({
            where: { id: app.id },
            data: {
                coverLetterContent: coverLetter.coverLetter,
                coverLetterSource: 'AI',
                generationStatus: client_1.ApplicationGenerationStatus.COMPLETED,
                generationError: null,
            },
        });
        await this.usage.incrementAiUsage(job.userId);
    }
    async runHybridAtsReport(job) {
        const app = await this.prisma.application.findFirstOrThrow({
            where: { id: job.applicationId, userId: job.userId },
            include: { profile: { include: { currentCv: true } } },
        });
        const jd = app.pastedJobDescription?.trim() ||
            String(jsonField(app.jobSnapshot, 'description') ?? '');
        if (!jd || !app.coverLetterContent) {
            throw new Error('Cover letter and job description required for ATS report');
        }
        const ats = await this.atsReportGen.generate({
            jobTitle: app.jobRoleTitle ?? 'Role',
            companyName: app.companyName ?? 'Company',
            jobDescription: jd,
            coverLetter: app.coverLetterContent,
            cvText: app.profile.currentCv?.parsedText ?? '',
        });
        await this.prisma.$transaction(async (tx) => {
            await tx.applicationAtsReport.upsert({
                where: { applicationId: app.id },
                create: {
                    applicationId: app.id,
                    score: ats.score,
                    letterScore: ats.letterScore ?? null,
                    cvScore: ats.cvScore ?? null,
                    missingKeywords: ats.missingKeywords,
                    suggestions: ats.suggestions,
                    strengths: ats.strengths,
                    gaps: ats.gaps,
                    actionableSteps: ats.actionableSteps,
                    keywordCoverage: ats.keywordCoverage,
                    icpMatch: ats.icpMatch,
                    breakdown: ats.breakdown,
                    assessedAt: new Date(),
                },
                update: {
                    score: ats.score,
                    letterScore: ats.letterScore ?? null,
                    cvScore: ats.cvScore ?? null,
                    missingKeywords: ats.missingKeywords,
                    suggestions: ats.suggestions,
                    strengths: ats.strengths,
                    gaps: ats.gaps,
                    actionableSteps: ats.actionableSteps,
                    keywordCoverage: ats.keywordCoverage,
                    icpMatch: ats.icpMatch,
                    breakdown: ats.breakdown,
                    assessedAt: new Date(),
                },
            });
            await tx.application.update({
                where: { id: app.id },
                data: {
                    generationStatus: client_1.ApplicationGenerationStatus.COMPLETED,
                    generationError: null,
                },
            });
        });
        await this.usage.incrementAiUsage(job.userId);
    }
};
exports.ApplicationAiWorkerService = ApplicationAiWorkerService;
exports.ApplicationAiWorkerService = ApplicationAiWorkerService = ApplicationAiWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jobs_service_1.JobsService,
        application_snapshot_service_1.ApplicationSnapshotService,
        cover_letter_generator_1.CoverLetterGenerator,
        ats_report_generator_1.AtsReportGenerator,
        job_facts_parser_1.JobFactsParser,
        usage_service_1.UsageService])
], ApplicationAiWorkerService);
function jsonField(json, key) {
    if (!json || typeof json !== 'object' || Array.isArray(json))
        return null;
    return json[key];
}
//# sourceMappingURL=application-ai-worker.service.js.map