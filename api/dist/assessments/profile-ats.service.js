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
exports.ProfileAtsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const profile_ats_generator_1 = require("../ai/profile-ats.generator");
const prisma_service_1 = require("../prisma/prisma.service");
const error_schema_1 = require("../shared/schemas/error.schema");
let ProfileAtsService = class ProfileAtsService {
    prisma;
    generator;
    constructor(prisma, generator) {
        this.prisma = prisma;
        this.generator = generator;
    }
    async runAssessment(userId, profileId) {
        const profile = await this.prisma.profile.findFirst({
            where: { id: profileId, userId },
            include: { currentCv: true },
        });
        if (!profile) {
            throw new error_schema_1.AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
        }
        if (!profile.currentCv) {
            throw new error_schema_1.AppError('CV_REQUIRED', 'Upload a CV before running ATS assessment', 400);
        }
        if (profile.currentCv.parseStatus === client_1.CvParseStatus.PENDING) {
            throw new error_schema_1.AppError('CV_PARSE_PENDING', 'CV is still being parsed; try again shortly', 409);
        }
        if (profile.currentCv.parseStatus === client_1.CvParseStatus.FAILED) {
            throw new error_schema_1.AppError('CV_PARSE_FAILED', 'CV parsing failed; re-upload a PDF or DOCX file', 400);
        }
        const parsedText = profile.currentCv.parsedText?.trim();
        if (!parsedText) {
            throw new error_schema_1.AppError('CV_TEXT_EMPTY', 'CV has no extractable text for assessment', 400);
        }
        const generated = await this.generator.generate({
            profile,
            parsedCvText: parsedText,
        });
        const row = await this.prisma.profileAtsAssessment.upsert({
            where: { profileId },
            create: {
                profileId,
                industry: profile.primaryIndustry,
                score: generated.score,
                missingKeywords: generated.missingKeywords,
                suggestions: generated.suggestions,
                breakdown: generated.breakdown,
                inputFingerprint: generated.inputFingerprint,
                assessedAt: new Date(),
            },
            update: {
                industry: profile.primaryIndustry,
                score: generated.score,
                missingKeywords: generated.missingKeywords,
                suggestions: generated.suggestions,
                breakdown: generated.breakdown,
                inputFingerprint: generated.inputFingerprint,
                assessedAt: new Date(),
            },
        });
        return this.toResponse(row);
    }
    async getForProfile(profileId) {
        const row = await this.prisma.profileAtsAssessment.findUnique({
            where: { profileId },
        });
        return row ? this.toResponse(row) : null;
    }
    toResponse(row) {
        return {
            profileId: row.profileId,
            industry: row.industry,
            score: row.score,
            missingKeywords: this.jsonStringArray(row.missingKeywords),
            suggestions: this.jsonStringArray(row.suggestions),
            breakdown: this.jsonNumberRecord(row.breakdown),
            inputFingerprint: row.inputFingerprint,
            assessedAt: row.assessedAt.toISOString(),
        };
    }
    jsonStringArray(value) {
        if (Array.isArray(value)) {
            return value.filter((v) => typeof v === 'string');
        }
        return [];
    }
    jsonNumberRecord(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {};
        }
        const out = {};
        for (const [key, val] of Object.entries(value)) {
            if (typeof val === 'number') {
                out[key] = val;
            }
        }
        return out;
    }
};
exports.ProfileAtsService = ProfileAtsService;
exports.ProfileAtsService = ProfileAtsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        profile_ats_generator_1.ProfileAtsGenerator])
], ProfileAtsService);
//# sourceMappingURL=profile-ats.service.js.map