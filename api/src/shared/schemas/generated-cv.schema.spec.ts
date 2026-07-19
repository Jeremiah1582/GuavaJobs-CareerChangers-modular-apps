import {
  FORBIDDEN_STORED_IDENTITY_KEYS,
  assertNoForbiddenStoredCvKeys,
  generatedCvStoredContentSchema,
  hydrateGeneratedCvContent,
  storedGeneratedCvContentSchema,
  stripIdentityFromStoredContent,
} from './generated-cv.schema';

describe('storedGeneratedCvContentSchema', () => {
  const validBase = {
    label: 'Software Engineer',
    summary:
      'Experienced engineer with a track record of shipping TypeScript services and product features.',
    coreCompetencies: ['TypeScript', 'React'],
    work: [
      {
        name: 'Acme',
        position: 'Engineer',
        startDate: '2020-01',
        endDate: null,
        highlights: ['Built APIs'],
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
      tailoredFor: 'Software Engineer @ Acme',
      generatedAt: new Date().toISOString(),
    },
  };

  it('accepts anonymous career body', () => {
    expect(storedGeneratedCvContentSchema.parse(validBase)).toMatchObject({
      label: 'Software Engineer',
    });
    expect(generatedCvStoredContentSchema.parse(validBase)).toMatchObject({
      label: 'Software Engineer',
    });
  });

  it('rejects identity keys in stored content', () => {
    for (const key of ['email', 'name', 'phone', 'basics', 'linkedinUrl']) {
      expect(() =>
        storedGeneratedCvContentSchema.parse({ ...validBase, [key]: 'x' }),
      ).toThrow();
    }
  });

  it('stripIdentityFromStoredContent removes forbidden keys', () => {
    const stripped = stripIdentityFromStoredContent({
      ...validBase,
      email: 'a@b.c',
    });
    for (const key of FORBIDDEN_STORED_IDENTITY_KEYS) {
      expect(stripped).not.toHaveProperty(key);
    }
    expect(storedGeneratedCvContentSchema.parse(stripped)).toBeTruthy();
  });

  it('assertNoForbiddenStoredCvKeys throws for email', () => {
    expect(() =>
      assertNoForbiddenStoredCvKeys({ ...validBase, email: 'a@b.c' }),
    ).toThrow(/email/i);
  });

  it('hydrateGeneratedCvContent merges basics without rejecting strict stored shape', () => {
    const hydrated = hydrateGeneratedCvContent(validBase, {
      name: 'Jane',
      email: 'jane@example.com',
      phone: null,
      label: 'Software Engineer',
      location: { city: 'London', country: 'GB' },
      profiles: [],
    });
    expect(hydrated.basics.email).toBe('jane@example.com');
    expect(hydrated.label).toBe('Software Engineer');
  });
});
