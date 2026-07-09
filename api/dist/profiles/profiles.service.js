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
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const profile_ats_service_1 = require("../assessments/profile-ats.service");
const cv_service_1 = require("../cv/cv.service");
const prisma_service_1 = require("../prisma/prisma.service");
const error_schema_1 = require("../shared/schemas/error.schema");
let ProfilesService = class ProfilesService {
    prisma;
    cvService;
    profileAtsService;
    constructor(prisma, cvService, profileAtsService) {
        this.prisma = prisma;
        this.cvService = cvService;
        this.profileAtsService = profileAtsService;
    }
    async list(userId) {
        const profiles = await this.prisma.profile.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        });
        return profiles.map((p) => this.toProfileResponse(p));
    }
    async getById(userId, profileId) {
        const profile = await this.findOwnedProfile(userId, profileId);
        const [currentCv, generalAtsAssessment] = await Promise.all([
            this.cvService.getCurrentCvMeta(profileId),
            this.profileAtsService.getForProfile(profileId),
        ]);
        return {
            ...this.toProfileResponse(profile),
            currentCv,
            generalAtsAssessment,
        };
    }
    async create(userId, input) {
        const shouldBeDefault = input.isDefault ??
            (await this.prisma.profile.count({ where: { userId } })) === 0;
        const profile = await this.prisma.$transaction(async (tx) => {
            if (shouldBeDefault) {
                await tx.profile.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }
            return tx.profile.create({
                data: {
                    userId,
                    profileTitle: input.profileTitle,
                    jobTitle: input.jobTitle,
                    seniority: input.seniority,
                    primaryIndustry: input.primaryIndustry,
                    summary: input.summary,
                    skills: input.skills ?? [],
                    jobCategories: input.jobCategories ?? [],
                    locationCity: input.locationCity,
                    locationCountry: input.locationCountry,
                    contactPhone: input.contactPhone,
                    salaryMin: input.salaryMin,
                    salaryMax: input.salaryMax,
                    salaryCurrency: input.salaryCurrency,
                    salaryPeriod: input.salaryPeriod,
                    isDefault: shouldBeDefault,
                },
            });
        });
        return this.toProfileResponse(profile);
    }
    async patch(userId, profileId, input) {
        await this.findOwnedProfile(userId, profileId);
        const { autofillAnswers, ...rest } = input;
        const profile = await this.prisma.$transaction(async (tx) => {
            if (rest.isDefault === true) {
                await tx.profile.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }
            const data = { ...rest };
            if (autofillAnswers !== undefined) {
                const current = await tx.profile.findFirstOrThrow({
                    where: { id: profileId },
                });
                const existing = current.autofillAnswers &&
                    typeof current.autofillAnswers === 'object' &&
                    !Array.isArray(current.autofillAnswers)
                    ? current.autofillAnswers
                    : {};
                data.autofillAnswers = {
                    ...existing,
                    ...autofillAnswers,
                };
            }
            return tx.profile.update({
                where: { id: profileId },
                data,
            });
        });
        return this.toProfileResponse(profile);
    }
    async findOwnedProfile(userId, profileId) {
        const profile = await this.prisma.profile.findFirst({
            where: { id: profileId, userId },
        });
        if (!profile) {
            throw new error_schema_1.AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
        }
        return profile;
    }
    toProfileResponse(profile) {
        const autofill = profile.autofillAnswers &&
            typeof profile.autofillAnswers === 'object' &&
            !Array.isArray(profile.autofillAnswers)
            ? profile.autofillAnswers
            : {};
        return {
            id: profile.id,
            userId: profile.userId,
            profileTitle: profile.profileTitle,
            jobTitle: profile.jobTitle,
            seniority: profile.seniority,
            primaryIndustry: profile.primaryIndustry,
            summary: profile.summary,
            skills: profile.skills,
            jobCategories: profile.jobCategories,
            locationCity: profile.locationCity,
            locationCountry: profile.locationCountry,
            contactPhone: profile.contactPhone,
            salaryMin: profile.salaryMin,
            salaryMax: profile.salaryMax,
            salaryCurrency: profile.salaryCurrency,
            salaryPeriod: profile.salaryPeriod,
            autofillAnswers: autofill,
            isDefault: profile.isDefault,
            currentCvId: profile.currentCvId,
            createdAt: profile.createdAt.toISOString(),
            updatedAt: profile.updatedAt.toISOString(),
        };
    }
};
exports.ProfilesService = ProfilesService;
exports.ProfilesService = ProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cv_service_1.CvService,
        profile_ats_service_1.ProfileAtsService])
], ProfilesService);
//# sourceMappingURL=profiles.service.js.map