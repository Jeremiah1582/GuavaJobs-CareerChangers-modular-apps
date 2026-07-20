import {
  mergeEnrichmentIntoContent,
  rebuildContentFromEnrichments,
  removeEnrichmentFromContent,
} from './career-cv.merge';
import { emptyCareerCvContent } from '../shared/schemas/career-cv.schema';

describe('career-cv.merge', () => {
  it('appends work highlight by default', () => {
    const base = emptyCareerCvContent();
    base.work.push({
      name: 'Acme',
      position: 'Engineer',
      startDate: '2020-01',
      endDate: null,
      highlights: ['Built APIs'],
    });

    const merged = mergeEnrichmentIntoContent(base, {
      gapText: 'Limited Kubernetes experience',
      answer: 'Ran production K8s clusters for 2 years at Acme',
    });

    expect(merged.work[0].highlights).toContain(
      'Ran production K8s clusters for 2 years at Acme',
    );
  });

  it('merges skills section into skills + coreCompetencies', () => {
    const merged = mergeEnrichmentIntoContent(emptyCareerCvContent(), {
      gapText: 'Missing React',
      answer: 'React, TypeScript',
      section: 'skills',
    });

    expect(merged.skills.map((s) => s.name)).toEqual(
      expect.arrayContaining(['React', 'TypeScript']),
    );
    expect(merged.coreCompetencies).toEqual(
      expect.arrayContaining(['React', 'TypeScript']),
    );
  });

  it('creates a project for projects section', () => {
    const merged = mergeEnrichmentIntoContent(emptyCareerCvContent(), {
      gapText: 'No open-source',
      answer: 'Maintained a CLI used by 200 developers',
      section: 'projects',
    });

    expect(merged.projects).toHaveLength(1);
    expect(merged.projects[0].name).toContain('open-source');
    expect(merged.projects[0].description).toContain('CLI');
  });

  it('sets or appends summary section', () => {
    const first = mergeEnrichmentIntoContent(emptyCareerCvContent(), {
      gapText: 'Weak summary',
      answer: 'Payments engineer with 5 years in fintech.',
      section: 'summary',
    });
    expect(first.summary).toBe('Payments engineer with 5 years in fintech.');

    const second = mergeEnrichmentIntoContent(first, {
      gapText: 'Add more',
      answer: 'Led a migration to event-driven billing.',
      section: 'summary',
    });
    expect(second.summary).toContain('Payments engineer');
    expect(second.summary).toContain('event-driven billing');
  });

  it('creates a work entry when none exist (default section)', () => {
    const merged = mergeEnrichmentIntoContent(emptyCareerCvContent(), {
      gapText: 'No production on-call',
      answer: 'Owned pager for payments API for 18 months',
    });

    expect(merged.work).toHaveLength(1);
    expect(merged.work[0].name).toBe('Additional experience');
    expect(merged.work[0].position).toContain('on-call');
    expect(merged.work[0].highlights).toEqual([
      'Owned pager for payments API for 18 months',
    ]);
  });

  it('rebuilds master content from enrichments (edit path)', () => {
    const enrichments = [
      {
        gapText: 'No Kubernetes',
        answer: 'Ran K8s in production for 2 years',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        gapText: 'Missing React',
        answer: 'React, TypeScript',
        section: 'skills',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ];

    const rebuilt = rebuildContentFromEnrichments(enrichments);

    expect(rebuilt.work[0].highlights).toContain(
      'Ran K8s in production for 2 years',
    );
    expect(rebuilt.skills.map((s) => s.name)).toEqual(
      expect.arrayContaining(['React', 'TypeScript']),
    );
  });

  it('removes a prior work highlight before re-merge on edit', () => {
    const enrichment = {
      gapText: 'No on-call',
      answer: 'Owned pager for payments API for 18 months',
    };
    const withAnswer = mergeEnrichmentIntoContent(
      emptyCareerCvContent(),
      enrichment,
    );
    expect(withAnswer.work[0].highlights).toHaveLength(1);

    const stripped = removeEnrichmentFromContent(withAnswer, enrichment);
    expect(stripped.work).toHaveLength(0);
  });

  it('appends composed micro-form answer as a work highlight', () => {
    const composed = [
      'Role: Backend Intern',
      'Dates: 2021–2022',
      'Details: Ran production K8s clusters for 2 years at Acme',
      'Outcome: Faster incident recovery',
    ].join('\n');

    const merged = mergeEnrichmentIntoContent(emptyCareerCvContent(), {
      gapText: 'Limited Kubernetes experience',
      answer: composed,
    });

    expect(merged.work[0].highlights).toContain(composed);
  });
});
