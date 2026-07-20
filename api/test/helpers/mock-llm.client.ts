/** Deterministic LLM stand-in — no network, no token cost. */
export class MockLlmClient {
  async chatJson(systemPrompt: string, _userPrompt: string): Promise<string> {
    if (/write honest, tailored cover letters/i.test(systemPrompt)) {
      return JSON.stringify({
        coverLetter:
          'Dear Hiring Manager,\n\nI am writing to express my interest in this role. ' +
          'My background in TypeScript and product delivery maps well to your requirements. ' +
          'I would welcome the chance to contribute and grow with your team.\n\nSincerely,\nE2E Candidate',
      });
    }

    if (/polish gap-fill answers/i.test(systemPrompt)) {
      return JSON.stringify({
        improvedAnswer:
          'Built REST APIs in Node.js and wrote integration tests, reducing flaky deploys by tracking failures.',
        factsUsed: [
          'REST APIs',
          'Node.js',
          'integration tests',
          'flaky deploys',
        ],
      });
    }

    if (/write ATS-aligned, job-tailored CV/i.test(systemPrompt)) {
      return JSON.stringify({
        label: 'Software Engineer',
        summary:
          'Full-stack engineer with TypeScript experience building reliable product features and APIs.',
        coreCompetencies: ['TypeScript', 'React', 'Node.js', 'API design'],
        work: [
          {
            position: 'Software Engineer',
            name: 'Example Corp',
            location: 'London, UK',
            startDate: '2022-01',
            endDate: null,
            highlights: [
              'Delivered TypeScript services used by thousands of users',
              'Collaborated with product to ship features on schedule',
            ],
          },
        ],
        education: [
          {
            institution: 'Example University',
            studyType: 'BSc',
            area: 'Computer Science',
            startDate: '2018-09',
            endDate: '2021-06',
          },
        ],
        skills: [{ name: 'TypeScript', keywords: ['React', 'Node.js'] }],
        certificates: [],
        projects: [],
        languages: [{ language: 'English', fluency: 'Native' }],
        awards: [],
        volunteer: [],
        meta: { schemaVersion: '1.0' },
      });
    }

    return JSON.stringify({
      score: 72,
      letterScore: 70,
      cvScore: 74,
      missingKeywords: ['kubernetes'],
      suggestions: ['Add cloud experience'],
      strengths: ['Strong communication'],
      gaps: ['No container experience'],
      actionableSteps: ['Learn Docker basics'],
      suggestedRoles: ['Software Engineer', 'Backend Engineer', 'Full-Stack Developer'],
      careerSuggestion:
        'Your CV is currently suited toward Software Engineer, Backend Engineer, and Full-Stack Developer — consider applying for these roles to leverage your existing experience.',
      keywordCoverage: { typescript: 1 },
      icpMatch: { fit: 'good' },
      breakdown: { skills: 70 },
    });
  }
}
