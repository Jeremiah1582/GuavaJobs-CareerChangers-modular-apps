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
exports.ApplicationSnapshotService = void 0;
const common_1 = require("@nestjs/common");
const storage_service_1 = require("../cv/storage.service");
const prisma_service_1 = require("../prisma/prisma.service");
const error_schema_1 = require("../shared/schemas/error.schema");
let ApplicationSnapshotService = class ApplicationSnapshotService {
    prisma;
    storage;
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    async buildForGenerate(userId, profileId, applicationId, job) {
        const profile = await this.prisma.profile.findFirst({
            where: { id: profileId, userId },
            include: { currentCv: true },
        });
        if (!profile) {
            throw new error_schema_1.AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
        }
        if (!profile.currentCv?.parsedText) {
            throw new error_schema_1.AppError('CV_REQUIRED', 'Upload and parse a CV before generating an application', 400);
        }
        const cvStorageKey = await this.copyCvForApplication(applicationId, profile.currentCv.storageKey, profile.currentCv.fileName, profile.currentCv.mimeType);
        return {
            jobSnapshot: {
                canonicalKey: job.canonicalKey,
                title: job.title,
                company: job.company,
                location: job.location,
                seniority: null,
                description: job.description,
                applyUrl: job.applyUrl,
                atsType: job.atsType,
                source: job.source,
                fetchedAt: job.fetchedAt,
            },
            profileSnapshot: this.profileToSnapshot(profile),
            cvSnapshot: {
                cvDocumentId: profile.currentCv.id,
                fileName: profile.currentCv.fileName,
                mimeType: profile.currentCv.mimeType,
                parsedText: profile.currentCv.parsedText,
                uploadedAt: profile.currentCv.uploadedAt.toISOString(),
            },
            cvStorageKey,
            applyUrl: job.applyUrl,
        };
    }
    profileToSnapshot(profile) {
        return {
            id: profile.id,
            profileTitle: profile.profileTitle,
            jobTitle: profile.jobTitle,
            seniority: profile.seniority,
            primaryIndustry: profile.primaryIndustry,
            summary: profile.summary,
            skills: profile.skills,
            jobCategories: profile.jobCategories,
            locationCity: profile.locationCity,
            locationCountry: profile.locationCountry,
        };
    }
    async copyCvForApplication(applicationId, sourceKey, fileName, mimeType) {
        const ext = fileName.split('.').pop()?.toLowerCase() ?? 'pdf';
        const destKey = `applications/${applicationId}/cv.${ext}`;
        const buffer = await this.storage.downloadObject(sourceKey);
        await this.storage.uploadObject(destKey, buffer, mimeType);
        return destKey;
    }
};
exports.ApplicationSnapshotService = ApplicationSnapshotService;
exports.ApplicationSnapshotService = ApplicationSnapshotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], ApplicationSnapshotService);
//# sourceMappingURL=application-snapshot.service.js.map