import {
  buildApplicationAtsFingerprint,
  resolveCvTextForAts,
  resolveCvTextForGeneration,
  resolveJobDescriptionForAts,
  serializeCareerContent,
} from './application-ats.fingerprint';

describe('application-ats.fingerprint', () => {
  it('changes when cover letter changes', () => {
    const base = {
      jobDescription: 'Build APIs in TypeScript',
      coverLetter: 'I build APIs',
      cvText: 'TypeScript engineer',
      cvChoice: 'UPLOADED' as const,
    };
    const a = buildApplicationAtsFingerprint(base);
    const b = buildApplicationAtsFingerprint({
      ...base,
      coverLetter: 'I build APIs and lead teams',
    });
    expect(a).not.toBe(b);
  });

  it('changes when career content is added', () => {
    const base = {
      jobDescription: 'Build APIs',
      coverLetter: 'I build APIs',
      cvText: 'TypeScript engineer',
      cvChoice: 'UPLOADED' as const,
    };
    const without = buildApplicationAtsFingerprint(base);
    const withCareer = buildApplicationAtsFingerprint({
      ...base,
      careerContent: JSON.stringify({ work: [{ name: 'Acme' }] }),
    });
    expect(without).not.toBe(withCareer);
  });

  it('keeps fingerprint stable when career is omitted or empty', () => {
    const base = {
      jobDescription: 'Build APIs',
      coverLetter: 'I build APIs',
      cvText: 'TypeScript engineer',
      cvChoice: 'UPLOADED' as const,
    };
    const omitted = buildApplicationAtsFingerprint(base);
    const empty = buildApplicationAtsFingerprint({
      ...base,
      careerContent: '   ',
    });
    const nullish = buildApplicationAtsFingerprint({
      ...base,
      careerContent: null,
    });
    expect(omitted).toBe(empty);
    expect(omitted).toBe(nullish);
  });

  it('serializeCareerContent stringifies objects and trims strings', () => {
    expect(serializeCareerContent({ summary: 'Led migration' })).toBe(
      JSON.stringify({ summary: 'Led migration' }),
    );
    expect(serializeCareerContent('  hello  ')).toBe('hello');
    expect(serializeCareerContent(null)).toBe('');
  });

  it('resolveJobDescriptionForAts prefers pasted over snapshot', () => {
    expect(
      resolveJobDescriptionForAts({
        pastedJobDescription: ' pasted JD ',
        jobSnapshot: { description: 'snapshot JD' },
      }),
    ).toBe('pasted JD');
  });

  it('resolveCvTextForAts uses generated content when GENERATED', () => {
    const text = resolveCvTextForAts({
      cvChoice: 'GENERATED',
      cvSnapshot: { parsedText: 'uploaded' },
      generatedCv: { content: { label: 'Engineer', work: [] } },
    });
    expect(text).toContain('Engineer');
  });

  it('resolveCvTextForAts appends master career content', () => {
    const text = resolveCvTextForAts({
      cvChoice: 'UPLOADED',
      cvSnapshot: { parsedText: 'uploaded cv' },
      careerCvContent: { summary: 'Led payments migration' },
    });
    expect(text).toContain('uploaded cv');
    expect(text).toContain('Master career profile');
    expect(text).toContain('Led payments migration');
  });

  it('resolveCvTextForGeneration prefers live profile CV over snapshot', () => {
    expect(
      resolveCvTextForGeneration({
        cvSnapshot: { parsedText: 'stale snapshot' },
        profile: { currentCv: { parsedText: ' latest upload ' } },
      }),
    ).toBe('latest upload');
    expect(
      resolveCvTextForGeneration({
        cvSnapshot: { parsedText: 'from snapshot' },
        profile: { currentCv: { parsedText: null } },
      }),
    ).toBe('from snapshot');
  });

  it('resolveCvTextForGeneration includes career when only career exists', () => {
    const text = resolveCvTextForGeneration({
      cvSnapshot: null,
      careerCvContent: { skills: [{ name: 'Go' }] },
    });
    expect(text).toContain('Master career profile');
    expect(text).toContain('Go');
  });
});
