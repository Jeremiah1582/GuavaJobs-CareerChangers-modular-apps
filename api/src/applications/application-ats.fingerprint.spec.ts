import {
  buildApplicationAtsFingerprint,
  resolveCvTextForAts,
  resolveCvTextForGeneration,
  resolveJobDescriptionForAts,
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
});
