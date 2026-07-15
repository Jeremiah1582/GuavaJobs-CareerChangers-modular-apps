import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FREE_AI_GENERATIONS_PER_MONTH } from '../src/shared/constants/freemium.constants';
import {
  cleanupE2eUser,
  createMoneyPathApp,
  e2eBearer,
  e2eUserId,
  ensureProfileWithCv,
  MoneyPathApp,
  pollGeneration,
  resetAiUsage,
  seedCachedJob,
} from './helpers/money-path-app';

describe('Money path — free-tier quota (e2e)', () => {
  let harness: MoneyPathApp;
  let app: INestApplication;
  const userKey = `quota-${Date.now()}`;
  const token = e2eBearer(userKey);
  const userId = e2eUserId(userKey);

  beforeAll(async () => {
    harness = await createMoneyPathApp();
    app = harness.app;
  }, 60_000);

  afterAll(async () => {
    await cleanupE2eUser(harness.prisma, userId);
    await app.close();
  });

  it(`allows ${FREE_AI_GENERATIONS_PER_MONTH} successful generates then returns QUOTA_EXCEEDED`, async () => {
    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', token)
      .expect(200);

    const { profileId } = await ensureProfileWithCv(harness.prisma, userId);
    await resetAiUsage(harness.prisma, userId);

    for (let i = 0; i < FREE_AI_GENERATIONS_PER_MONTH; i++) {
      const job = await seedCachedJob(
        harness.jobCache,
        `quota-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      );

      const create = await request(app.getHttpServer())
        .post('/api/v1/applications/generate')
        .set('Authorization', token)
        .send({ profileId, canonicalJobKey: job.canonicalKey })
        .expect(202);

      const completed = await pollGeneration(app, token, create.body.id);
      expect(completed.generationStatus).toBe('COMPLETED');
    }

    const overLimitJob = await seedCachedJob(
      harness.jobCache,
      `quota-over-${Date.now()}`,
    );

    const blocked = await request(app.getHttpServer())
      .post('/api/v1/applications/generate')
      .set('Authorization', token)
      .send({
        profileId,
        canonicalJobKey: overLimitJob.canonicalKey,
      })
      .expect(402);

    expect(blocked.body).toEqual({
      error: {
        code: 'QUOTA_EXCEEDED',
        message: expect.stringContaining(String(FREE_AI_GENERATIONS_PER_MONTH)),
      },
    });
  }, 120_000);
});
