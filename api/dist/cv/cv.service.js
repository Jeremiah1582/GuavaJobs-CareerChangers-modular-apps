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
exports.CvService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bullmq_2 = require("bullmq");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const error_schema_1 = require("../shared/schemas/error.schema");
const queue_constants_1 = require("../queue/queue.constants");
const storage_service_1 = require("./storage.service");
const MAX_CV_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
]);
let CvService = class CvService {
    prisma;
    storage;
    cvParseQueue;
    constructor(prisma, storage, cvParseQueue) {
        this.prisma = prisma;
        this.storage = storage;
        this.cvParseQueue = cvParseQueue;
    }
    async uploadCv(userId, profileId, file) {
        await this.assertProfileOwnership(userId, profileId);
        this.validateFile(file);
        const ext = this.extensionFor(file);
        const cvId = (0, crypto_1.randomUUID)();
        const storageKey = `profiles/${profileId}/cv/${cvId}.${ext}`;
        await this.storage.uploadObject(storageKey, file.buffer, file.mimetype);
        const cv = await this.prisma.$transaction(async (tx) => {
            if (await tx.profile.findFirst({ where: { id: profileId, userId } })) {
                const previous = await tx.cvDocument.findMany({
                    where: { profileId, isActive: true },
                });
                if (previous.length) {
                    await tx.cvDocument.updateMany({
                        where: { profileId, isActive: true },
                        data: { isActive: false },
                    });
                }
            }
            const created = await tx.cvDocument.create({
                data: {
                    id: cvId,
                    profileId,
                    storageKey,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    fileSizeBytes: file.size,
                    parseStatus: client_1.CvParseStatus.PENDING,
                    isActive: true,
                },
            });
            await tx.profile.update({
                where: { id: profileId },
                data: { currentCvId: created.id },
            });
            return created;
        });
        await this.cvParseQueue.add('parse', { cvDocumentId: cv.id, profileId, userId }, {
            jobId: `cv-parse-${cv.id}`,
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
        });
        return {
            profileId,
            currentCvId: cv.id,
            cv: this.toCvMeta(cv),
        };
    }
    async getDownloadUrl(userId, profileId) {
        await this.assertProfileOwnership(userId, profileId);
        const profile = await this.prisma.profile.findFirst({
            where: { id: profileId, userId },
            include: { currentCv: true },
        });
        if (!profile?.currentCv) {
            throw new error_schema_1.AppError('CV_NOT_FOUND', 'No CV uploaded for this profile', 404);
        }
        const { signedUrl, expiresInSeconds } = await this.storage.createSignedDownloadUrl(profile.currentCv.storageKey);
        return {
            signedUrl,
            expiresInSeconds,
            fileName: profile.currentCv.fileName,
        };
    }
    async getCurrentCvMeta(profileId) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
            include: { currentCv: true },
        });
        if (!profile?.currentCv) {
            return null;
        }
        return this.toCvMeta(profile.currentCv);
    }
    validateFile(file) {
        if (!file?.buffer?.length) {
            throw new error_schema_1.AppError('VALIDATION_ERROR', 'CV file is required', 400);
        }
        if (file.size > MAX_CV_BYTES) {
            throw new error_schema_1.AppError('VALIDATION_ERROR', `CV must be ${MAX_CV_BYTES / 1024 / 1024}MB or smaller`, 400);
        }
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            throw new error_schema_1.AppError('VALIDATION_ERROR', 'CV must be PDF, DOCX, or plain text', 400);
        }
    }
    extensionFor(file) {
        const fromName = file.originalname.split('.').pop()?.toLowerCase();
        if (fromName === 'pdf')
            return 'pdf';
        if (fromName === 'docx')
            return 'docx';
        if (fromName === 'txt')
            return 'txt';
        if (file.mimetype === 'application/pdf')
            return 'pdf';
        if (file.mimetype ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            return 'docx';
        }
        return 'bin';
    }
    async assertProfileOwnership(userId, profileId) {
        const profile = await this.prisma.profile.findFirst({
            where: { id: profileId, userId },
        });
        if (!profile) {
            throw new error_schema_1.AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
        }
    }
    toCvMeta(cv) {
        return {
            id: cv.id,
            fileName: cv.fileName,
            mimeType: cv.mimeType,
            fileSizeBytes: cv.fileSizeBytes,
            parseStatus: cv.parseStatus,
            uploadedAt: cv.uploadedAt.toISOString(),
        };
    }
};
exports.CvService = CvService;
exports.CvService = CvService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)(queue_constants_1.CV_PARSE_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        bullmq_2.Queue])
], CvService);
//# sourceMappingURL=cv.service.js.map