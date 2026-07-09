import { Injectable } from '@nestjs/common';
import { Prisma, Profile } from '@prisma/client';
import { ProfileAtsService } from '../assessments/profile-ats.service';
import { CvService } from '../cv/cv.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import {
  CreateProfileInput,
  PatchProfileInput,
  ProfileDetailResponse,
  ProfileResponse,
} from '../shared/schemas/profile.schema';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvService: CvService,
    private readonly profileAtsService: ProfileAtsService,
  ) {}

  async list(userId: string): Promise<ProfileResponse[]> {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return profiles.map((p) => this.toProfileResponse(p));
  }

  async getById(userId: string, profileId: string): Promise<ProfileDetailResponse> {
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

  async create(
    userId: string,
    input: CreateProfileInput,
  ): Promise<ProfileResponse> {
    const shouldBeDefault =
      input.isDefault ??
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

  async patch(
    userId: string,
    profileId: string,
    input: PatchProfileInput,
  ): Promise<ProfileResponse> {
    await this.findOwnedProfile(userId, profileId);
    const { autofillAnswers, ...rest } = input;

    const profile = await this.prisma.$transaction(async (tx) => {
      if (rest.isDefault === true) {
        await tx.profile.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const data: Prisma.ProfileUpdateInput = { ...rest };

      if (autofillAnswers !== undefined) {
        const current = await tx.profile.findFirstOrThrow({
          where: { id: profileId },
        });
        const existing =
          current.autofillAnswers &&
          typeof current.autofillAnswers === 'object' &&
          !Array.isArray(current.autofillAnswers)
            ? (current.autofillAnswers as Record<string, unknown>)
            : {};
        data.autofillAnswers = {
          ...existing,
          ...autofillAnswers,
        } as Prisma.InputJsonValue;
      }

      return tx.profile.update({
        where: { id: profileId },
        data,
      });
    });

    return this.toProfileResponse(profile);
  }

  private async findOwnedProfile(
    userId: string,
    profileId: string,
  ): Promise<Profile> {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
    });
    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }
    return profile;
  }

  private toProfileResponse(profile: Profile): ProfileResponse {
    const autofill =
      profile.autofillAnswers &&
      typeof profile.autofillAnswers === 'object' &&
      !Array.isArray(profile.autofillAnswers)
        ? (profile.autofillAnswers as Record<string, unknown>)
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
}
