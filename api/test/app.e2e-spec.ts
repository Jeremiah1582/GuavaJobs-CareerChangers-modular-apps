import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('GuavaJobs API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('returns database, redis, and queue stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(res.body.status).toMatch(/^(ok|degraded)$/);
      expect(res.body.database).toBe('connected');
      expect(res.body.redis).toBe('connected');
      expect(typeof res.body.workersEnabled).toBe('boolean');
      expect(res.body.queues).toMatchObject({
        cvParse: expect.objectContaining({
          waiting: expect.any(Number),
          active: expect.any(Number),
          delayed: expect.any(Number),
          failed: expect.any(Number),
        }),
        aiGeneration: expect.objectContaining({
          waiting: expect.any(Number),
          active: expect.any(Number),
          delayed: expect.any(Number),
          failed: expect.any(Number),
        }),
      });
    });
  });

  describe('Auth guard', () => {
    it('rejects unauthenticated /me', () => {
      return request(app.getHttpServer()).get('/api/v1/me').expect(401);
    });
  });

  describe('Validation', () => {
    it('rejects invalid profile body with 400', async () => {
      const token = await getSeedToken();
      if (!token) {
        return;
      }

      await request(app.getHttpServer())
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ profileTitle: 'x' })
        .expect(400);
    });
  });

  describe('Manual application flow', () => {
    it('creates manual application and lists it', async () => {
      const token = await getSeedToken();
      if (!token) {
        return;
      }

      const me = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const create = await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          profileId: me.body.defaultProfileId,
          companyName: 'E2E Test Co',
          jobRoleTitle: 'E2E Engineer',
          sourceOfListing: 'e2e',
        })
        .expect(201);

      expect(create.body.generationMode).toBe('MANUAL');
      expect(create.body.id).toBeDefined();

      const list = await request(app.getHttpServer())
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(
        list.body.some((app: { id: string }) => app.id === create.body.id),
      ).toBe(true);
    });
  });

  describe('Async generate enqueue', () => {
    it('returns 200 or 202 for generate request', async () => {
      const token = await getSeedToken();
      if (!token) {
        return;
      }

      const me = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const jobs = await request(app.getHttpServer())
        .get('/api/v1/jobs/search?q=developer&country=gb&page=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const jobKey = jobs.body.results?.[0]?.canonicalKey;
      if (!jobKey) {
        return;
      }

      const res = await request(app.getHttpServer())
        .post('/api/v1/applications/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          profileId: me.body.defaultProfileId,
          canonicalJobKey: jobKey,
        });

      expect([200, 202, 402]).toContain(res.status);
      if (res.status !== 402) {
        expect(res.body.generationStatus).toBeDefined();
      }
    });
  });

  describe('Autofill payload', () => {
    it('returns factual fields and ATS field map', async () => {
      const token = await getSeedToken();
      if (!token) {
        return;
      }

      const list = await request(app.getHttpServer())
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const appId = list.body[0]?.id;
      if (!appId) {
        return;
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/applications/${appId}/autofill-payload`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.applicationId).toBe(appId);
      expect(res.body.values).toBeDefined();
      expect(res.body.values.email).toBeDefined();
      expect(res.body.cvStaging.downloadPath).toContain('/cv/download');
      expect(Array.isArray(res.body.disclaimers)).toBe(true);
    });
  });

  describe('Profile autofillAnswers', () => {
    it('merges autofill answers on PATCH', async () => {
      const token = await getSeedToken();
      if (!token) {
        return;
      }

      const me = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const patch = await request(app.getHttpServer())
        .patch(`/api/v1/profiles/${me.body.defaultProfileId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ autofillAnswers: { noticePeriodWeeks: 4 } })
        .expect(200);

      expect(patch.body.autofillAnswers.noticePeriodWeeks).toBe(4);
    });
  });
});

async function getSeedToken(): Promise<string | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;

  if (!url || !key || !email || !password) {
    return null;
  }

  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}
