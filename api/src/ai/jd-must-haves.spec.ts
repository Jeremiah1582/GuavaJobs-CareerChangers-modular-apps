import { extractJdMustHaves } from './jd-must-haves';

describe('extractJdMustHaves', () => {
  it('pulls must-haves, tools, years, and certs from a typical JD', () => {
    const jd = `
Senior Backend Engineer

Requirements:
- 5+ years of experience with Node.js and TypeScript
- Kubernetes and Docker in production
- AWS Certified Developer preferred

Nice to have:
- GraphQL, Terraform

Responsibilities:
- Build APIs
`;
    const out = extractJdMustHaves(jd);
    expect(out.yearsRequired).toBe(5);
    expect(out.tools.map((t) => t.toLowerCase())).toEqual(
      expect.arrayContaining(['node.js', 'typescript', 'kubernetes', 'docker']),
    );
    expect(out.mustHaveSkills.length).toBeGreaterThan(0);
    expect(out.domain).toBe('software');
    expect(
      out.certifications.some((c) => /AWS/i.test(c)),
    ).toBe(true);
  });
});
