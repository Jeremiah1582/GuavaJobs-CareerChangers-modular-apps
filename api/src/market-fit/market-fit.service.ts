import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { MarketFitGenerator } from '../ai/market-fit.generator';
import { EnvConfig } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import {
  normalizeAdzunaCountry,
  type AdzunaCountryCode,
} from '../shared/constants/adzuna-countries';
import { AppError } from '../shared/schemas/error.schema';
import {
  marketFitResponseSchema,
  type MarketFitResponse,
  type MarketFitRole,
} from '../shared/schemas/market-fit.schema';
import { serializeCareerContent } from '../applications/application-ats.fingerprint';
import { SalaryLookupService } from './salary/salary-lookup.service';

@Injectable()
export class MarketFitService {
  private readonly logger = new Logger(MarketFitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: MarketFitGenerator,
    private readonly salaryLookup: SalaryLookupService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  private isEnabled(): boolean {
    return this.config.get('MARKET_FIT_ENABLED', { infer: true }) !== false;
  }

  private paywallEnabled(): boolean {
    return (
      this.config.get('MARKET_FIT_PAYWALL_ENABLED', { infer: true }) === true
    );
  }

  async getCached(
    userId: string,
    profileId: string,
  ): Promise<MarketFitResponse | null> {
    this.assertFeatureEnabled();
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
      include: {
        currentCv: true,
        careerCv: true,
        marketFit: true,
      },
    });
    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }
    if (!profile.marketFit) return null;

    const fingerprint = await this.computeFingerprint(profile);
    const stored = profile.marketFit.content as MarketFitResponse;
    const parsed = marketFitResponseSchema.safeParse({
      ...stored,
      stale: fingerprint !== profile.marketFit.inputFingerprint,
      paywall: {
        enabled: this.paywallEnabled(),
        message: this.paywallEnabled()
          ? 'Market Fit will require a subscription in a future release.'
          : null,
      },
    });
    return parsed.success ? parsed.data : null;
  }

  async generate(
    userId: string,
    profileId: string,
  ): Promise<MarketFitResponse> {
    this.assertFeatureEnabled();

    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
      include: {
        currentCv: true,
        careerCv: true,
      },
    });
    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }

    if (!profile.skills.length) {
      throw new AppError(
        'SKILLS_REQUIRED',
        'Add skills to your profile before generating Market Fit',
        400,
      );
    }

    const regionCountry = normalizeAdzunaCountry(profile.locationCountry);
    const fingerprint = await this.computeFingerprint(profile);

    const llmOut = await this.generator.generate({
      skills: profile.skills,
      summary: profile.summary,
      seniority: profile.seniority,
      primaryIndustry: profile.primaryIndustry,
      locationCountry: regionCountry,
      locationCity: profile.locationCity,
      cvText: profile.currentCv?.parsedText ?? null,
      careerCorpus: profile.careerCv?.content ?? null,
    });

    const roles: MarketFitRole[] = [];
    for (const role of llmOut.roles) {
      const salary = await this.salaryLookup.lookup(
        role.title,
        regionCountry,
        profile.seniority,
      );
      roles.push({
        title: role.title,
        fitLevel: role.fitLevel,
        whyFit: role.whyFit,
        evidenceSkills: role.evidenceSkills,
        salary,
        searchCta: {
          q: role.title,
          country: regionCountry,
          location: profile.locationCity?.trim() || undefined,
        },
      });
    }

    const generatedAt = new Date();
    const response: MarketFitResponse = marketFitResponseSchema.parse({
      profileId,
      regionCountry,
      currency: this.salaryLookup.currencyForCountry(regionCountry),
      generatedAt: generatedAt.toISOString(),
      inputFingerprint: fingerprint,
      stale: false,
      paywall: {
        enabled: this.paywallEnabled(),
        message: this.paywallEnabled()
          ? 'Market Fit will require a subscription in a future release.'
          : null,
      },
      roles,
      attribution: this.salaryLookup.attributionsForCountry(regionCountry),
    });

    await this.prisma.profileMarketFit.upsert({
      where: { profileId },
      create: {
        profileId,
        content: response as unknown as Prisma.InputJsonValue,
        inputFingerprint: fingerprint,
        regionCountry,
        generatedAt,
      },
      update: {
        content: response as unknown as Prisma.InputJsonValue,
        inputFingerprint: fingerprint,
        regionCountry,
        generatedAt,
      },
    });

    this.logger.log(
      `Market fit generated for profile ${profileId} (${regionCountry})`,
    );
    return response;
  }

  private assertFeatureEnabled(): void {
    if (!this.isEnabled()) {
      throw new AppError(
        'FEATURE_DISABLED',
        'Market Fit is temporarily disabled',
        404,
      );
    }
  }

  private async computeFingerprint(profile: {
    skills: string[];
    summary: string | null;
    seniority: string;
    primaryIndustry: string;
    locationCountry: string | null;
    locationCity: string | null;
    currentCv: { parsedText: string | null } | null;
    careerCv: { content: unknown } | null;
  }): Promise<string> {
    const cvText = profile.currentCv?.parsedText?.trim() ?? '';
    const cvTextHash = cvText
      ? createHash('sha256').update(cvText).digest('hex')
      : null;
    const careerHash = profile.careerCv?.content
      ? createHash('sha256')
          .update(serializeCareerContent(profile.careerCv.content))
          .digest('hex')
      : null;

    return this.generator.fingerprint({
      skills: profile.skills,
      summary: profile.summary,
      seniority: profile.seniority as never,
      primaryIndustry: profile.primaryIndustry as never,
      locationCountry: normalizeAdzunaCountry(
        profile.locationCountry,
      ) as AdzunaCountryCode,
      locationCity: profile.locationCity,
      cvTextHash,
      careerHash,
    });
  }
}
