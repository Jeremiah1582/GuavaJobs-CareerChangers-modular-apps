import { INestApplication } from '@nestjs/common';
import request from 'supertest';
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

describe('Money path — async generate (e2e)', () => {
  let harness: MoneyPathApp;
  let app: INestApplication;
  const userKey = `gen-${Date.now()}`;
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

  it('POST /applications/generate → poll until COMPLETED with snapshots + atsReport', async () => {
    // Warm auth + default profile
    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', token)
      .expect(200);

    const { profileId } = await ensureProfileWithCv(harness.prisma, userId);
    await resetAiUsage(harness.prisma, userId);

    const job = await seedCachedJob(
      harness.jobCache,
      `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    );

    const create = await request(app.getHttpServer())
      .post('/api/v1/applications/generate')
      .set('Authorization', token)
      .send({ profileId, canonicalJobKey: job.canonicalKey })
      .expect(202);

    expect(create.body.generationMode).toBe('AI');
    expect(create.body.generationStatus).toBe('PENDING');
    expect(create.body.id).toBeDefined();

    const completed = await pollGeneration(app, token, create.body.id);

    expect(completed.generationStatus).toBe('COMPLETED');
    expect(completed.coverLetterSource).toBe('AI');
    expect(typeof completed.coverLetterContent).toBe('string');
    expect((completed.coverLetterContent as string).length).toBeGreaterThan(50);
    expect(completed.jobSnapshot).toMatchObject({
      canonicalKey: job.canonicalKey,
      company: job.company,
    });
    expect(completed.profileSnapshot).toBeTruthy();
    expect(completed.cvSnapshot).toMatchObject({
      parsedText: expect.stringContaining('TypeScript'),
    });
    expect(completed.atsReport).toMatchObject({
      score: expect.any(Number),
      missingKeywords: expect.any(Array),
      suggestions: expect.any(Array),
    });
    expect(completed.generatedCv).toMatchObject({
      content: expect.objectContaining({
        label: expect.any(String),
        summary: expect.any(String),
        work: expect.any(Array),
      }),
      edited: false,
    });
    expect(completed.cvChoice).toBe('GENERATED');
    expect(
      (completed.generatedCvExport as { basics?: { name?: string; email?: string } })
        ?.basics,
    ).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
    });
  }, 45_000);
});
