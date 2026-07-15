/** Deterministic LLM stand-in — no network, no token cost. */
export class MockLlmClient {
  async chatJson(systemPrompt: string, _userPrompt: string): Promise<string> {
    // ATS system prompt also mentions "cover letter" — match cover-letter writer first by intent.
    if (/write honest, tailored cover letters/i.test(systemPrompt)) {
      return JSON.stringify({
        coverLetter:
          'Dear Hiring Manager,\n\nI am writing to express my interest in this role. ' +
          'My background in TypeScript and product delivery maps well to your requirements. ' +
          'I would welcome the chance to contribute and grow with your team.\n\nSincerely,\nE2E Candidate',
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
      keywordCoverage: { typescript: 1 },
      icpMatch: { fit: 'good' },
      breakdown: { skills: 70 },
    });
  }
}
