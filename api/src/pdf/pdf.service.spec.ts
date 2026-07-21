jest.mock('@react-pdf/renderer', () => ({
  renderToBuffer: jest.fn(async () =>
    Buffer.from(
      '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF',
      'utf8',
    ),
  ),
  StyleSheet: { create: <T extends Record<string, unknown>>(styles: T) => styles },
  Document: 'Document',
  Page: 'Page',
  Text: 'Text',
  View: 'View',
}));

import { hydratedGeneratedCvExportSchema } from '../shared/schemas/generated-cv.schema';
import { normalizeCvPdfLayout, PdfService } from './pdf.service';

const sampleExport = hydratedGeneratedCvExportSchema.parse({
  label: 'Software Engineer',
  summary:
    'Full-stack engineer with TypeScript experience building APIs and product features.',
  coreCompetencies: ['TypeScript', 'React', 'Node.js'],
  work: [
    {
      name: 'Example Corp',
      position: 'Software Engineer',
      location: 'London, UK',
      startDate: '2022-01',
      endDate: null,
      highlights: ['Delivered TypeScript APIs', 'Led migration to NestJS'],
    },
  ],
  education: [
    {
      institution: 'Example University',
      area: 'Computer Science',
      studyType: 'BSc',
      startDate: '2018-09',
      endDate: '2021-06',
    },
  ],
  skills: [{ name: 'TypeScript', keywords: ['NestJS', 'React'] }],
  certificates: [],
  projects: [],
  languages: [],
  awards: [],
  volunteer: [],
  basics: {
    name: 'Jane Candidate',
    email: 'jane@example.com',
    phone: '+44 7700 900000',
    label: 'Software Engineer',
    location: { city: 'London', country: 'GB' },
    profiles: [{ network: 'LinkedIn', url: 'https://linkedin.com/in/jane' }],
  },
  meta: {
    schemaVersion: 'json-ats-v1',
    tailoredFor: 'Software Engineer @ Example Corp',
    generatedAt: '2026-07-19T12:00:00.000Z',
  },
});

describe('PdfService', () => {
  const service = new PdfService();

  it('renders classic CV PDF to a non-empty buffer', async () => {
    const buffer = await service.generatedCvPdf({
      content: sampleExport,
      layout: 'classic',
    });
    expect(buffer.length).toBeGreaterThan(10);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('renders modern CV PDF to a non-empty buffer', async () => {
    const buffer = await service.generatedCvPdf({
      content: sampleExport,
      layout: 'modern',
    });
    expect(buffer.length).toBeGreaterThan(10);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('renders cover letter PDF with polished header', async () => {
    const buffer = await service.coverLetterPdf({
      applicantName: 'Jane Candidate',
      email: 'jane@example.com',
      coverLetter: 'Dear hiring manager,\n\nI am excited to apply.',
      companyName: 'Example Corp',
      jobTitle: 'Software Engineer',
    });
    expect(buffer.length).toBeGreaterThan(200);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});

describe('normalizeCvPdfLayout', () => {
  it('defaults to classic', () => {
    expect(normalizeCvPdfLayout(undefined)).toBe('classic');
  });

  it('rejects unknown layout', () => {
    expect(() => normalizeCvPdfLayout('fancy')).toThrow(/layout/i);
  });
});
