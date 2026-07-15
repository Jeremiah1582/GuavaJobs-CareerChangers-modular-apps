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
} from './helpers/money-path-app';

const PASTED_JD =
  'We need a Software Engineer with TypeScript and NestJS experience. ' +
  'You will own API design, PostgreSQL schemas, and Redis caching. '.repeat(3);

describe('Money path — manual + hybrid (e2e)', () => {
  let harness: MoneyPathApp;
  let app: INestApplication;
  const userKey = `manual-${Date.now()}`;
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

  it('creates MANUAL application without snapshots/report; hybrid cover letter sets coverLetterSource AI', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', token)
      .expect(200);

    const { profileId } = await ensureProfileWithCv(harness.prisma, userId);
    await resetAiUsage(harness.prisma, userId);

    const create = await request(app.getHttpServer())
      .post('/api/v1/applications')
      .set('Authorization', token)
      .send({
        profileId,
        companyName: 'Manual Co',
        jobRoleTitle: 'Backend Engineer',
        sourceOfListing: 'e2e-manual',
        pastedJobDescription: PASTED_JD,
      })
      .expect(201);

    expect(create.body.generationMode).toBe('MANUAL');
    expect(create.body.jobSnapshot).toBeNull();
    expect(create.body.profileSnapshot).toBeNull();
    expect(create.body.cvSnapshot).toBeNull();
    expect(create.body.atsReport).toBeNull();
    expect(create.body.coverLetterContent).toBeNull();

    const hybrid = await request(app.getHttpServer())
      .post(`/api/v1/applications/${create.body.id}/generate-cover-letter`)
      .set('Authorization', token)
      .send({})
      .expect(202);

    expect(hybrid.body.generationStatus).toBe('PENDING');

    const completed = await pollGeneration(app, token, create.body.id);

    expect(completed.generationStatus).toBe('COMPLETED');
    expect(completed.coverLetterSource).toBe('AI');
    expect(typeof completed.coverLetterContent).toBe('string');
    expect((completed.coverLetterContent as string).length).toBeGreaterThan(50);
    // Manual package still has no job/cv snapshots from AI generate path
    expect(completed.jobSnapshot).toBeNull();
    expect(completed.atsReport).toBeNull();
  }, 45_000);
});
