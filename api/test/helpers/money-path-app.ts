import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CvParseStatus, ProfileIndustry, SeniorityLevel } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { LlmClient } from '../../src/ai/llm.client';
import { SupabaseJwtService } from '../../src/auth/supabase-jwt.service';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { StorageService } from '../../src/cv/storage.service';
import { buildAdzunaKey } from '../../src/jobs/ats/canonical-key.util';
import { JobCacheService } from '../../src/jobs/cache/job-cache.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UnifiedJob } from '../../src/shared/schemas/job.schema';
import { MockLlmClient } from './mock-llm.client';
import { MockStorageService } from './mock-storage.service';

export type MoneyPathApp = {
  app: INestApplication;
  module: TestingModule;
  prisma: PrismaService;
  jobCache: JobCacheService;
};

/**
 * Force local Redis for money-path e2e.
 * Developer `.env` may point at Coolify Redis hostnames that do not resolve locally.
 * Use DB index 15 + a BullMQ prefix so a local `nest start --watch` cannot steal e2e jobs.
 */
function ensureE2eRedisUrl(): void {
  const forced = process.env.E2E_REDIS_URL ?? 'redis://127.0.0.1:6379/15';
  process.env.REDIS_URL = forced;
  process.env.BULLMQ_PREFIX = process.env.BULLMQ_PREFIX || 'bull-e2e';
}

/**
 * Money-path auth: Bearer token is the stable user id (`e2e-<suffix>`).
 * Real SupabaseAuthGuard stays in place; only JWKS verification is stubbed.
 */
function mockJwtService() {
  return {
    onModuleInit() {
      // no-op — skip remote JWKS setup
    },
    async verifyAccessToken(token: string) {
      if (!token.startsWith('e2e-')) {
        throw new Error('E2E JWT mock expects token starting with e2e-');
      }
      return {
        payload: {
          sub: token,
          email: `${token}@e2e.guavajobs.test`,
          user_metadata: { name: 'E2E User' },
        },
        protectedHeader: { alg: 'HS256' },
        key: undefined as never,
      };
    },
  };
}

export async function createMoneyPathApp(): Promise<MoneyPathApp> {
  ensureE2eRedisUrl();

  const module = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SupabaseJwtService)
    .useValue(mockJwtService())
    .overrideProvider(LlmClient)
    .useClass(MockLlmClient)
    .overrideProvider(StorageService)
    .useClass(MockStorageService)
    .compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  return {
    app,
    module,
    prisma: module.get(PrismaService),
    jobCache: module.get(JobCacheService),
  };
}

export function e2eBearer(userKey: string): string {
  return `Bearer e2e-${userKey}`;
}

export function e2eUserId(userKey: string): string {
  return `e2e-${userKey}`;
}

const SAMPLE_CV = `
Jane Candidate
Software Engineer

Experience:
- Built TypeScript APIs at Acme Corp (2020-2024)
- Led a small product delivery team

Skills: TypeScript, NestJS, PostgreSQL, Redis
Education: BSc Computer Science
`.trim();

/** Ensure profile has a parsed CV (required for AI generate). */
export async function ensureProfileWithCv(
  prisma: PrismaService,
  userId: string,
): Promise<{ profileId: string }> {
  const profile = await prisma.profile.findFirstOrThrow({
    where: { userId, isDefault: true },
  });

  if (profile.currentCvId) {
    const cv = await prisma.cvDocument.findUnique({
      where: { id: profile.currentCvId },
    });
    if (cv?.parsedText) {
      return { profileId: profile.id };
    }
  }

  const cv = await prisma.cvDocument.create({
    data: {
      profileId: profile.id,
      storageKey: `e2e/${userId}/cv.pdf`,
      fileName: 'cv.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1024,
      parsedText: SAMPLE_CV,
      parseStatus: CvParseStatus.READY,
      isActive: true,
    },
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      currentCvId: cv.id,
      jobTitle: profile.jobTitle || 'Software Engineer',
      seniority: profile.seniority || SeniorityLevel.MID,
      primaryIndustry: profile.primaryIndustry || ProfileIndustry.SOFTWARE,
      summary: profile.summary ?? 'E2E test profile',
      skills: profile.skills.length
        ? profile.skills
        : ['TypeScript', 'NestJS', 'PostgreSQL'],
    },
  });

  return { profileId: profile.id };
}

export async function seedCachedJob(
  jobCache: JobCacheService,
  adzunaId: string,
): Promise<UnifiedJob> {
  const canonicalKey = buildAdzunaKey('gb', adzunaId);
  const job: UnifiedJob = {
    canonicalKey,
    title: 'Senior Software Engineer',
    company: 'E2E Test Co',
    location: 'London, UK',
    snippet: 'Build APIs with TypeScript and NestJS.',
    description:
      'We are hiring a Senior Software Engineer to build TypeScript APIs with NestJS, PostgreSQL, and Redis. Experience with job platforms is a plus. Kubernetes is nice to have.',
    applyUrl: 'https://www.adzuna.com/details/e2e-test',
    atsType: 'adzuna',
    hasFullDescription: true,
    applyType: 'url',
    source: 'adzuna',
    fetchedAt: new Date().toISOString(),
    adzunaId,
    adzunaCountry: 'gb',
    salaryMin: 70000,
    salaryMax: 90000,
    salaryCurrency: 'GBP',
    postedAt: new Date().toISOString(),
  };
  await jobCache.setJob(job);
  return job;
}

export async function resetAiUsage(
  prisma: PrismaService,
  userId: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      aiGenerationsUsedPeriod: 0,
      usagePeriodStart: new Date(),
    },
  });
}

export async function pollGeneration(
  app: INestApplication,
  token: string,
  applicationId: string,
  opts?: { timeoutMs?: number; intervalMs?: number },
): Promise<Record<string, unknown>> {
  const timeoutMs = opts?.timeoutMs ?? 20_000;
  const intervalMs = opts?.intervalMs ?? 250;
  const started = Date.now();
  let last: Record<string, unknown> | null = null;

  const request = (await import('supertest')).default;

  while (Date.now() - started < timeoutMs) {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/applications/${applicationId}`)
      .set('Authorization', token);

    if (res.status !== 200) {
      throw new Error(
        `GET application returned ${res.status}: ${JSON.stringify(res.body)}`,
      );
    }

    last = res.body as Record<string, unknown>;
    const status = last.generationStatus;
    if (status === 'COMPLETED' || status === 'FAILED') {
      return last;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    `Timed out waiting for generation; last status=${String(last?.generationStatus)} error=${String(last?.generationError)}`,
  );
}

export async function cleanupE2eUser(
  prisma: PrismaService,
  userId: string,
): Promise<void> {
  await prisma.user.deleteMany({ where: { id: userId } });
}
