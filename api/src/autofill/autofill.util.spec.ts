import {
  buildAutofillValues,
  detectAtsType,
  getFieldMapForAts,
  splitFullName,
} from './autofill.util';

describe('autofill.util', () => {
  describe('detectAtsType', () => {
    it('detects from canonical key', () => {
      expect(detectAtsType('greenhouse:stripe:12345', null)).toBe('greenhouse');
      expect(detectAtsType('lever:acme:abc', null)).toBe('lever');
    });

    it('detects from apply URL', () => {
      expect(
        detectAtsType(null, 'https://boards.greenhouse.io/acme/jobs/123'),
      ).toBe('greenhouse');
      expect(detectAtsType(null, 'https://jobs.lever.co/acme/abc')).toBe(
        'lever',
      );
    });

    it('returns unknown when not supported', () => {
      expect(detectAtsType('adzuna:gb:1', null)).toBe('unknown');
    });
  });

  describe('getFieldMapForAts', () => {
    it('returns greenhouse map', () => {
      const map = getFieldMapForAts('greenhouse');
      expect(map?.atsType).toBe('greenhouse');
      expect(map?.fields.length).toBeGreaterThan(0);
    });

    it('returns null for unsupported ATS', () => {
      expect(getFieldMapForAts('unknown')).toBeNull();
    });
  });

  describe('splitFullName', () => {
    it('splits first and last name', () => {
      expect(splitFullName('Jane Developer')).toEqual({
        firstName: 'Jane',
        lastName: 'Developer',
        fullName: 'Jane Developer',
      });
    });
  });

  describe('buildAutofillValues', () => {
    it('merges profile autofill answers', () => {
      const values = buildAutofillValues({
        user: {
          name: 'Jane Developer',
          email: 'jane@example.com',
          linkedinUrl: 'https://linkedin.com/in/jane',
          githubUrl: null,
        },
        profile: {
          jobTitle: 'Engineer',
          locationCity: 'London',
          locationCountry: 'GB',
          contactPhone: '+44123456789',
          autofillAnswers: {
            workAuthorization: 'UK citizen',
            requiresSponsorship: false,
          },
        },
        application: {
          coverLetterContent: 'Dear hiring manager...',
          jobRoleTitle: 'Senior Engineer',
          companyName: 'Acme',
        },
      });

      expect(values.email).toBe('jane@example.com');
      expect(values.workAuthorization).toBe('UK citizen');
      expect(values.requiresSponsorship).toBe(false);
      expect(values.coverLetter).toBe('Dear hiring manager...');
    });
  });
});
