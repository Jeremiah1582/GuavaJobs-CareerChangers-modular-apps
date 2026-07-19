import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';

const now = new Date('2026-07-19T12:00:00.000Z');

function baseApp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app_1',
    userId: 'user_1',
    profileId: 'profile_1',
    status: 'DRAFT',
    generationMode: 'AI',
    canonicalJobKey: 'adzuna:gb:1',
    applyUrl: 'https://example.com/apply',
    generationStatus: 'COMPLETED',
    generationError: null,
    jobSnapshot: {
      title: 'Engineer',
      company: 'Acme',
      description: 'Short board snippet',
      otherField: 'keep-me',
    },
    profileSnapshot: {},
    cvSnapshot: {},
    snapshottedAt: now,
    pastedJobDescription: null,
    companyName: 'Acme',
    jobRoleTitle: 'Engineer',
    jobLocation: null,
    jobWebsite: null,
    industry: null,
    sourceOfListing: 'Adzuna',
    languageRequired: [],
    jobStartDate: null,
    jobSalaryMin: null,
    jobSalaryMax: null,
    jobSalaryCurrency: null,
    jobSalaryPeriod: null,
    jobSalaryRaw: null,
    userFitRating: null,
    coverLetterContent: 'Letter',
    coverLetterTemplateId: 'classic',
    coverLetterSource: 'AI',
    coverLetterEdited: false,
    cvChoice: 'UPLOADED',
    appliedAt: null,
    createdAt: now,
    updatedAt: now,
    atsReport: null,
    generatedCv: null,
    ...overrides,
  };
}

const sampleCvContent = {
  label: 'Software Engineer',
  summary: 'Built APIs',
  coreCompetencies: ['TypeScript'],
  work: [
    {
      name: 'Acme',
      position: 'Engineer',
      startDate: '2022-01',
      endDate: '2024-06',
      highlights: ['Shipped features'],
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

describe('ApplicationsService.patch', () => {
  let service: ApplicationsService;
  let prisma: {
    application: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    generatedCv: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      application: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      generatedCv: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new ApplicationsService(
      prisma as unknown as PrismaService,
      {} as never,
    );
  });

  it('merges pastedJobDescription into jobSnapshot.description', async () => {
    const current = baseApp();
    prisma.application.findFirst.mockResolvedValue(current);
    prisma.application.update.mockResolvedValue({
      ...current,
      pastedJobDescription: 'Full pasted JD text here',
      jobSnapshot: {
        ...(current.jobSnapshot as object),
        description: 'Full pasted JD text here',
      },
    });

    await service.patch('user_1', 'app_1', {
      pastedJobDescription: 'Full pasted JD text here',
    });

    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app_1' },
        data: expect.objectContaining({
          pastedJobDescription: 'Full pasted JD text here',
          jobSnapshot: {
            title: 'Engineer',
            company: 'Acme',
            description: 'Full pasted JD text here',
            otherField: 'keep-me',
          },
        }),
      }),
    );
  });

  it('sets generatedCv.edited=true when patching generatedCvContent', async () => {
    const current = baseApp();
    prisma.application.findFirst.mockResolvedValue(current);
    prisma.generatedCv.findUnique.mockResolvedValue({
      id: 'gcv_1',
      applicationId: 'app_1',
      content: sampleCvContent,
      edited: false,
    });
    prisma.generatedCv.update.mockResolvedValue({
      id: 'gcv_1',
      edited: true,
    });
    prisma.application.update.mockResolvedValue({
      ...current,
      generatedCv: {
        id: 'gcv_1',
        content: sampleCvContent,
        edited: true,
        templateId: 'json-ats-v1',
        sourceCvDocumentId: null,
        createdAt: now,
        updatedAt: now,
      },
    });

    await service.patch('user_1', 'app_1', {
      generatedCvContent: sampleCvContent,
    });

    expect(prisma.generatedCv.update).toHaveBeenCalledWith({
      where: { applicationId: 'app_1' },
      data: {
        content: sampleCvContent,
        edited: true,
      },
    });
  });

  it('rejects generatedCvContent when no GeneratedCv exists', async () => {
    prisma.application.findFirst.mockResolvedValue(baseApp());
    prisma.generatedCv.findUnique.mockResolvedValue(null);

    await expect(
      service.patch('user_1', 'app_1', {
        generatedCvContent: sampleCvContent,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
