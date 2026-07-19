import { ApplicationAiWorkerService } from './application-ai-worker.service';
import { ApplicationSnapshotService } from './application-snapshot.service';
import { AtsReportGenerator } from '../ai/ats-report.generator';
import { CoverLetterGenerator } from '../ai/cover-letter.generator';
import { GeneratedCvGenerator } from '../ai/generated-cv.generator';
import { JobFactsParser } from '../ai/job-facts.parser';
import { JobsService } from '../jobs/jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../users/usage.service';

const jobData = {
  canonicalKey: 'adzuna:gb:1',
  title: 'Backend Engineer',
  company: 'Acme',
  location: 'Remote',
  snippet: 'Build APIs',
  description: 'Resolved job description from cache',
  applyUrl: 'https://example.com/apply',
  atsType: 'adzuna' as const,
  hasFullDescription: true,
  applyType: 'url' as const,
  source: 'adzuna' as const,
  fetchedAt: '2026-07-19T12:00:00.000Z',
};

const bundle = {
  jobSnapshot: {
    canonicalKey: jobData.canonicalKey,
    title: jobData.title,
    company: jobData.company,
    description: 'Snapshot description',
  },
  profileSnapshot: { jobTitle: 'Engineer' },
  cvSnapshot: { parsedText: 'TypeScript experience', cvDocumentId: 'cv_1' },
  cvStorageKey: 'cvs/app_1.pdf',
  applyUrl: jobData.applyUrl,
};

const sampleCvContent = {
  label: 'Backend Engineer',
  summary: 'Built APIs',
  coreCompetencies: ['TypeScript'],
  work: [
    {
      name: 'Prev Co',
      position: 'Engineer',
      startDate: '2022-01',
      endDate: '2024-06',
      highlights: ['Shipped services'],
    },
  ],
  education: [],
  skills: [{ name: 'TypeScript' }],
  certificates: [],
  projects: [],
  languages: [],
  awards: [],
  volunteer: [],
  meta: {
    schemaVersion: 'json-ats-v1',
    generatedAt: '2026-07-19T12:00:00.000Z',
  },
};

describe('ApplicationAiWorkerService.runFullGenerate', () => {
  let service: ApplicationAiWorkerService;
  let prisma: {
    application: { update: jest.Mock; findFirstOrThrow: jest.Mock };
    user: { findUniqueOrThrow: jest.Mock };
    generatedCv: { upsert: jest.Mock; findUnique: jest.Mock };
    applicationAtsReport: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let coverLetterGen: { generate: jest.Mock };
  let generatedCvGen: { generate: jest.Mock };
  let atsReportGen: { generate: jest.Mock };
  let jobs: { getByCanonicalKey: jest.Mock };
  let snapshots: { buildForGenerate: jest.Mock };
  let usage: { incrementAiUsage: jest.Mock };

  beforeEach(() => {
    prisma = {
      application: {
        update: jest.fn().mockResolvedValue({}),
        findFirstOrThrow: jest.fn(),
      },
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ metadata: {} }),
      },
      generatedCv: {
        upsert: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      applicationAtsReport: { upsert: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<void>) =>
        fn(prisma),
      ),
    };
    coverLetterGen = {
      generate: jest.fn().mockResolvedValue({
        coverLetter: 'A'.repeat(60),
      }),
    };
    generatedCvGen = {
      generate: jest.fn().mockResolvedValue({ content: sampleCvContent }),
    };
    atsReportGen = {
      generate: jest.fn().mockResolvedValue({
        score: 70,
        letterScore: 72,
        cvScore: 68,
        missingKeywords: [],
        suggestions: [],
        strengths: [],
        gaps: [],
        actionableSteps: [],
        keywordCoverage: {},
        icpMatch: {},
        breakdown: {},
      }),
    };
    jobs = {
      getByCanonicalKey: jest.fn().mockResolvedValue(jobData),
    };
    snapshots = {
      buildForGenerate: jest.fn().mockResolvedValue(bundle),
    };
    usage = { incrementAiUsage: jest.fn().mockResolvedValue(undefined) };

    service = new ApplicationAiWorkerService(
      prisma as unknown as PrismaService,
      jobs as unknown as JobsService,
      snapshots as unknown as ApplicationSnapshotService,
      coverLetterGen as unknown as CoverLetterGenerator,
      generatedCvGen as unknown as GeneratedCvGenerator,
      atsReportGen as unknown as AtsReportGenerator,
      new JobFactsParser(),
      usage as unknown as UsageService,
    );
  });

  it('skips GeneratedCv when autoGenerateTailoredCv is off (default)', async () => {
    prisma.application.findFirstOrThrow.mockResolvedValue({
      id: 'app_1',
      userId: 'user_1',
      profileId: 'profile_1',
      canonicalJobKey: jobData.canonicalKey,
      jobSnapshot: bundle.jobSnapshot,
      pastedJobDescription: null,
      jobRoleTitle: jobData.title,
      companyName: jobData.company,
      applyUrl: jobData.applyUrl,
      cvChoice: 'UPLOADED',
    });
    prisma.generatedCv.findUnique.mockResolvedValue(null);

    await service.process({
      type: 'generate',
      applicationId: 'app_1',
      userId: 'user_1',
    });

    expect(coverLetterGen.generate).toHaveBeenCalled();
    expect(atsReportGen.generate).toHaveBeenCalled();
    expect(generatedCvGen.generate).not.toHaveBeenCalled();
    expect(prisma.generatedCv.upsert).not.toHaveBeenCalled();

    const updateData = prisma.application.update.mock.calls.find(
      (call) => call[0]?.data?.coverLetterContent,
    )?.[0]?.data;
    expect(updateData?.cvChoice).toBeUndefined();
  });

  it('runs GeneratedCv when autoGenerateTailoredCv is true', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      metadata: { autoGenerateTailoredCv: true },
    });
    prisma.application.findFirstOrThrow.mockResolvedValue({
      id: 'app_1',
      userId: 'user_1',
      profileId: 'profile_1',
      canonicalJobKey: jobData.canonicalKey,
      jobSnapshot: bundle.jobSnapshot,
      pastedJobDescription: null,
      jobRoleTitle: jobData.title,
      companyName: jobData.company,
      applyUrl: jobData.applyUrl,
      cvChoice: 'UPLOADED',
    });
    prisma.generatedCv.findUnique.mockResolvedValue(null);

    await service.process({
      type: 'generate',
      applicationId: 'app_1',
      userId: 'user_1',
    });

    expect(generatedCvGen.generate).toHaveBeenCalled();
    expect(prisma.generatedCv.upsert).toHaveBeenCalled();
  });

  it('runs GeneratedCv on regenerate when one already exists (even if pref off)', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({ metadata: {} });
    prisma.application.findFirstOrThrow.mockResolvedValue({
      id: 'app_1',
      userId: 'user_1',
      profileId: 'profile_1',
      canonicalJobKey: jobData.canonicalKey,
      jobSnapshot: bundle.jobSnapshot,
      pastedJobDescription: null,
      jobRoleTitle: jobData.title,
      companyName: jobData.company,
      applyUrl: jobData.applyUrl,
      cvChoice: 'GENERATED',
    });
    prisma.generatedCv.findUnique.mockResolvedValue({ id: 'gcv_1' });

    await service.process({
      type: 'regenerate',
      applicationId: 'app_1',
      userId: 'user_1',
    });

    expect(generatedCvGen.generate).toHaveBeenCalled();
    expect(prisma.generatedCv.upsert).toHaveBeenCalled();
  });

  it('soft-fails GeneratedCv so letter + ATS still complete', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      metadata: { autoGenerateTailoredCv: true },
    });
    prisma.application.findFirstOrThrow.mockResolvedValue({
      id: 'app_1',
      userId: 'user_1',
      profileId: 'profile_1',
      canonicalJobKey: jobData.canonicalKey,
      jobSnapshot: bundle.jobSnapshot,
      pastedJobDescription: null,
      jobRoleTitle: jobData.title,
      companyName: jobData.company,
      applyUrl: jobData.applyUrl,
      cvChoice: 'UPLOADED',
    });
    prisma.generatedCv.findUnique.mockResolvedValue(null);
    generatedCvGen.generate.mockRejectedValue(
      new Error('Expected YYYY-MM or YYYY-MM-DD'),
    );

    await service.process({
      type: 'generate',
      applicationId: 'app_1',
      userId: 'user_1',
    });

    expect(coverLetterGen.generate).toHaveBeenCalled();
    expect(atsReportGen.generate).toHaveBeenCalled();
    expect(prisma.generatedCv.upsert).not.toHaveBeenCalled();
    const updateData = prisma.application.update.mock.calls.find(
      (call) => call[0]?.data?.coverLetterContent,
    )?.[0]?.data;
    expect(updateData?.generationStatus).toBe('COMPLETED');
  });

  it('prefers pastedJobDescription over snapshot / resolved JD', async () => {
    const pasted = 'Full pasted job description for the role at Acme';
    prisma.application.findFirstOrThrow.mockResolvedValue({
      id: 'app_1',
      userId: 'user_1',
      profileId: 'profile_1',
      canonicalJobKey: jobData.canonicalKey,
      jobSnapshot: bundle.jobSnapshot,
      pastedJobDescription: pasted,
      jobRoleTitle: jobData.title,
      companyName: jobData.company,
      applyUrl: jobData.applyUrl,
    });

    await service.process({
      type: 'generate',
      applicationId: 'app_1',
      userId: 'user_1',
    });

    expect(coverLetterGen.generate).toHaveBeenCalledWith(
      expect.objectContaining({ jobDescription: pasted }),
    );
    expect(atsReportGen.generate).toHaveBeenCalledWith(
      expect.objectContaining({ jobDescription: pasted }),
    );
  });

  it('falls back to stored jobSnapshot when Redis cache misses on regenerate', async () => {
    const cacheError = new Error(
      'Job not in cache; run search again to refresh Adzuna listings',
    );
    jobs.getByCanonicalKey.mockRejectedValue(cacheError);
    prisma.application.findFirstOrThrow.mockResolvedValue({
      id: 'app_1',
      userId: 'user_1',
      profileId: 'profile_1',
      canonicalJobKey: jobData.canonicalKey,
      jobSnapshot: bundle.jobSnapshot,
      pastedJobDescription: null,
      jobRoleTitle: jobData.title,
      companyName: jobData.company,
      applyUrl: jobData.applyUrl,
    });

    await service.process({
      type: 'regenerate',
      applicationId: 'app_1',
      userId: 'user_1',
    });

    expect(jobs.getByCanonicalKey).toHaveBeenCalledWith(jobData.canonicalKey, {
      expandAts: true,
    });
    expect(snapshots.buildForGenerate).toHaveBeenCalledWith(
      'user_1',
      'profile_1',
      'app_1',
      expect.objectContaining({
        title: jobData.title,
        company: jobData.company,
        description: bundle.jobSnapshot.description,
      }),
    );
    expect(coverLetterGen.generate).toHaveBeenCalled();
  });

  it('uses pastedJobDescription when cache misses and snapshot lacks description', async () => {
    const pasted = 'Stored pasted JD after cache expiry';
    jobs.getByCanonicalKey.mockRejectedValue(
      new Error(
        'Job not in cache; run search again to refresh Adzuna listings',
      ),
    );
    prisma.application.findFirstOrThrow.mockResolvedValue({
      id: 'app_1',
      userId: 'user_1',
      profileId: 'profile_1',
      canonicalJobKey: jobData.canonicalKey,
      jobSnapshot: {
        canonicalKey: jobData.canonicalKey,
        title: jobData.title,
        company: jobData.company,
      },
      pastedJobDescription: pasted,
      jobRoleTitle: jobData.title,
      companyName: jobData.company,
      applyUrl: jobData.applyUrl,
    });

    await service.process({
      type: 'regenerate',
      applicationId: 'app_1',
      userId: 'user_1',
    });

    expect(snapshots.buildForGenerate).toHaveBeenCalledWith(
      'user_1',
      'profile_1',
      'app_1',
      expect.objectContaining({ description: pasted }),
    );
    expect(coverLetterGen.generate).toHaveBeenCalledWith(
      expect.objectContaining({ jobDescription: pasted }),
    );
  });

  it('uses app jobRoleTitle/companyName when cache misses and snapshot is empty', async () => {
    jobs.getByCanonicalKey.mockRejectedValue(
      new Error(
        'Job not in cache; run search again to refresh Adzuna listings',
      ),
    );
    prisma.application.findFirstOrThrow.mockResolvedValue({
      id: 'app_1',
      userId: 'user_1',
      profileId: 'profile_1',
      canonicalJobKey: jobData.canonicalKey,
      jobSnapshot: null,
      pastedJobDescription: 'Role requirements and responsibilities',
      jobRoleTitle: jobData.title,
      companyName: jobData.company,
      applyUrl: jobData.applyUrl,
    });

    await service.process({
      type: 'generate',
      applicationId: 'app_1',
      userId: 'user_1',
    });

    expect(snapshots.buildForGenerate).toHaveBeenCalledWith(
      'user_1',
      'profile_1',
      'app_1',
      expect.objectContaining({
        title: jobData.title,
        company: jobData.company,
        description: 'Role requirements and responsibilities',
      }),
    );
  });

  it('fails when cache misses and no usable stored job data exists', async () => {
    jobs.getByCanonicalKey.mockRejectedValue(
      new Error(
        'Job not in cache; run search again to refresh Adzuna listings',
      ),
    );
    prisma.application.findFirstOrThrow.mockResolvedValue({
      id: 'app_1',
      userId: 'user_1',
      profileId: 'profile_1',
      canonicalJobKey: jobData.canonicalKey,
      jobSnapshot: { title: jobData.title },
      pastedJobDescription: null,
      jobRoleTitle: null,
      companyName: null,
      applyUrl: null,
    });

    await expect(
      service.process({
        type: 'regenerate',
        applicationId: 'app_1',
        userId: 'user_1',
      }),
    ).rejects.toThrow('Job not in cache');

    expect(snapshots.buildForGenerate).not.toHaveBeenCalled();
    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app_1' },
        data: expect.objectContaining({
          generationStatus: 'FAILED',
          generationError: expect.stringContaining('Job not in cache'),
        }),
      }),
    );
  });
});

describe('ApplicationAiWorkerService.hybrid-generate-cv', () => {
  let service: ApplicationAiWorkerService;
  let prisma: {
    application: {
      update: jest.Mock;
      updateMany: jest.Mock;
      findFirstOrThrow: jest.Mock;
    };
    generatedCv: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let generatedCvGen: { generate: jest.Mock };
  let usage: { incrementAiUsage: jest.Mock };

  beforeEach(() => {
    prisma = {
      application: {
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 'app_1',
          userId: 'user_1',
          profileId: 'profile_1',
          generationStatus: 'COMPLETED',
          generationMode: 'AI',
          jobRoleTitle: 'Backend Engineer',
          companyName: 'Acme',
          pastedJobDescription: 'Build APIs with TypeScript and NestJS',
          jobSnapshot: { description: 'Snapshot JD' },
          cvSnapshot: { parsedText: 'stale', cvDocumentId: 'cv_old' },
          cvChoice: 'UPLOADED',
          profile: {
            jobTitle: 'Engineer',
            summary: 'Builds APIs',
            skills: ['TypeScript'],
            currentCv: { id: 'cv_1', parsedText: 'Latest CV text' },
          },
        }),
      },
      generatedCv: { upsert: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<void>) =>
        fn(prisma),
      ),
    };
    generatedCvGen = {
      generate: jest.fn().mockResolvedValue({ content: sampleCvContent }),
    };
    usage = { incrementAiUsage: jest.fn().mockResolvedValue(undefined) };

    service = new ApplicationAiWorkerService(
      prisma as unknown as PrismaService,
      { getByCanonicalKey: jest.fn() } as unknown as JobsService,
      { buildForGenerate: jest.fn() } as unknown as ApplicationSnapshotService,
      { generate: jest.fn() } as unknown as CoverLetterGenerator,
      generatedCvGen as unknown as GeneratedCvGenerator,
      { generate: jest.fn() } as unknown as AtsReportGenerator,
      new JobFactsParser(),
      usage as unknown as UsageService,
    );
  });

  it('generates CV only without flipping package generationStatus', async () => {
    await service.process({
      type: 'hybrid-generate-cv',
      applicationId: 'app_1',
      userId: 'user_1',
    });

    expect(generatedCvGen.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        cvText: 'Latest CV text',
        jobDescription: 'Build APIs with TypeScript and NestJS',
      }),
    );
    expect(prisma.generatedCv.upsert).toHaveBeenCalled();
    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { cvChoice: 'GENERATED' },
      }),
    );
    // Completed packages must not enter PROCESSING / COMPLETED churn.
    expect(prisma.application.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          generationStatus: 'PROCESSING',
        }),
      }),
    );
    expect(prisma.application.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          generationStatus: 'COMPLETED',
        }),
      }),
    );
    expect(usage.incrementAiUsage).toHaveBeenCalledWith('user_1');
  });

  it('does not mark COMPLETED packages FAILED when CV generation errors', async () => {
    generatedCvGen.generate.mockRejectedValue(new Error('LLM timeout'));

    await expect(
      service.process({
        type: 'hybrid-generate-cv',
        applicationId: 'app_1',
        userId: 'user_1',
      }),
    ).rejects.toThrow('LLM timeout');

    expect(prisma.application.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'app_1',
          generationStatus: {
            in: ['PENDING', 'PROCESSING'],
          },
        }),
      }),
    );
    expect(prisma.application.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          generationStatus: 'FAILED',
        }),
      }),
    );
  });
});
