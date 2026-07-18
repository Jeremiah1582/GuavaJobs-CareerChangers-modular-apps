import { ProfileIndustry, SeniorityLevel } from '@prisma/client';
import { getIndustryCriteria } from './industry-criteria';

export type AtsChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type CvAtsHeuristicResult = {
  checklist: AtsChecklistItem[];
  keywordHits: string[];
  missingKeywords: string[];
  heuristicScore: number;
  signals: {
    wordCount: number;
    hasEmail: boolean;
    hasPhone: boolean;
    hasLinkedIn: boolean;
    sectionHits: string[];
    quantifiedBullets: number;
  };
};

const SECTION_PATTERNS: Array<{ id: string; re: RegExp }> = [
  { id: 'experience', re: /\b(experience|employment|work history|professional experience)\b/i },
  { id: 'education', re: /\b(education|academic|qualifications|university|degree)\b/i },
  { id: 'skills', re: /\b(skills|technical skills|core competencies|technologies)\b/i },
];

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_RE =
  /(?:\+|00)?[\d\s().-]{7,}\d|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const LINKEDIN_RE = /linkedin\.com\/in\//i;
const QUANTIFIED_RE =
  /\b(\d+%|\$\d[\d,]*(?:\.\d+)?[kmb]?|\d+\+?\s*(years?|clients?|users?|projects?|teams?))\b/i;

/**
 * Deterministic ATS-oriented checks so job seekers get useful feedback even
 * when the LLM is slow/unavailable — and so keyword gaps are grounded in
 * industry criteria rather than invented.
 */
export function analyzeCvHeuristics(
  cvText: string,
  industry: ProfileIndustry,
  _seniority: SeniorityLevel,
): CvAtsHeuristicResult {
  const text = cvText.replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

  const hasEmail = EMAIL_RE.test(text);
  const hasPhone = PHONE_RE.test(text);
  const hasLinkedIn = LINKEDIN_RE.test(text);

  const sectionHits = SECTION_PATTERNS.filter((s) => s.re.test(text)).map(
    (s) => s.id,
  );

  const sentences = text.split(/[•\n.|]/).filter((s) => s.trim().length > 12);
  const quantifiedBullets = sentences.filter((s) => QUANTIFIED_RE.test(s)).length;

  const criteria = getIndustryCriteria(industry);
  const keywordHits: string[] = [];
  const missingKeywords: string[] = [];
  for (const kw of criteria.keywordFocus) {
    const needle = kw.toLowerCase();
    // Match whole phrases loosely (allow punctuation between words).
    const parts = needle.split(/\s+/).filter(Boolean);
    const found =
      parts.length === 1
        ? lower.includes(parts[0])
        : parts.every((p) => lower.includes(p));
    if (found) {
      keywordHits.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const checklist: AtsChecklistItem[] = [
    {
      id: 'contact_email',
      label: 'Email address',
      passed: hasEmail,
      detail: hasEmail
        ? 'ATS parsers can extract a contact email.'
        : 'Add a plain-text email — image-only contact blocks are often skipped.',
    },
    {
      id: 'contact_phone',
      label: 'Phone number',
      passed: hasPhone,
      detail: hasPhone
        ? 'A phone number is present in plain text.'
        : 'Include a phone number recruiters can dial without opening an attachment.',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn (optional)',
      passed: hasLinkedIn,
      detail: hasLinkedIn
        ? 'LinkedIn URL detected.'
        : 'A LinkedIn URL helps when applications ask for a profile link.',
    },
    {
      id: 'sections',
      label: 'Standard sections',
      passed: sectionHits.length >= 2,
      detail:
        sectionHits.length >= 2
          ? `Detected: ${sectionHits.join(', ')}.`
          : 'Use clear headings (Experience, Education, Skills) so ATS section parsers succeed.',
    },
    {
      id: 'length',
      label: 'CV length',
      passed: wordCount >= 250 && wordCount <= 1200,
      detail:
        wordCount < 250
          ? `Only ~${wordCount} words — too thin for most mid+ roles.`
          : wordCount > 1200
            ? `~${wordCount} words — trim to 1–2 pages of high-signal content.`
            : `~${wordCount} words — a healthy ATS-friendly length.`,
    },
    {
      id: 'keywords',
      label: 'Industry keyword coverage',
      passed: keywordHits.length >= Math.ceil(criteria.keywordFocus.length * 0.4),
      detail: `Matched ${keywordHits.length}/${criteria.keywordFocus.length} ${criteria.label} focus terms. Only add terms you can honestly defend.`,
    },
    {
      id: 'quantified_impact',
      label: 'Quantified impact',
      passed: quantifiedBullets >= 2,
      detail:
        quantifiedBullets >= 2
          ? `Found ~${quantifiedBullets} lines with numbers or scale.`
          : 'Add metrics to existing achievements (%, £, users, time saved) — do not invent figures.',
    },
  ];

  const weights: Record<string, number> = {
    contact_email: 12,
    contact_phone: 8,
    linkedin: 4,
    sections: 18,
    length: 14,
    keywords: 28,
    quantified_impact: 16,
  };

  let earned = 0;
  let total = 0;
  for (const item of checklist) {
    const w = weights[item.id] ?? 10;
    total += w;
    if (item.passed) earned += w;
  }
  const heuristicScore = Math.round((earned / Math.max(total, 1)) * 100);

  return {
    checklist,
    keywordHits,
    missingKeywords,
    heuristicScore,
    signals: {
      wordCount,
      hasEmail,
      hasPhone,
      hasLinkedIn,
      sectionHits,
      quantifiedBullets,
    },
  };
}
