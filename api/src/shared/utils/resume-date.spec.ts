import { normalizeResumeDate } from './resume-date';

describe('normalizeResumeDate', () => {
  it('passes through canonical forms', () => {
    expect(normalizeResumeDate('2020-01')).toBe('2020-01');
    expect(normalizeResumeDate('2020-01-15')).toBe('2020-01-15');
  });

  it('maps undefined/null/empty/present', () => {
    expect(normalizeResumeDate(undefined)).toBeUndefined();
    expect(normalizeResumeDate(null)).toBeNull();
    expect(normalizeResumeDate('')).toBeNull();
    expect(normalizeResumeDate('  ')).toBeNull();
    expect(normalizeResumeDate('Present')).toBeNull();
    expect(normalizeResumeDate('current')).toBeNull();
    expect(normalizeResumeDate('Now')).toBeNull();
    expect(normalizeResumeDate('N/A')).toBeNull();
  });

  it('normalizes year-only and numeric years', () => {
    expect(normalizeResumeDate('2018')).toBe('2018-01');
    expect(normalizeResumeDate(2019)).toBe('2019-01');
  });

  it('normalizes ISO datetimes and unpadded months', () => {
    expect(normalizeResumeDate('2020-01-15T00:00:00.000Z')).toBe('2020-01-15');
    expect(normalizeResumeDate('2020-1')).toBe('2020-01');
    expect(normalizeResumeDate('2020-1-5')).toBe('2020-01-05');
  });

  it('normalizes slash and month-name formats', () => {
    expect(normalizeResumeDate('01/2020')).toBe('2020-01');
    expect(normalizeResumeDate('2020/06')).toBe('2020-06');
    expect(normalizeResumeDate('Jan 2020')).toBe('2020-01');
    expect(normalizeResumeDate('September 2021')).toBe('2021-09');
    expect(normalizeResumeDate('2020 Jan')).toBe('2020-01');
    expect(normalizeResumeDate('Jan 15, 2020')).toBe('2020-01-15');
  });

  it('takes the start year from a simple range', () => {
    expect(normalizeResumeDate('2018-2020')).toBe('2018-01');
    expect(normalizeResumeDate('2018 – Present')).toBe('2018-01');
  });

  it('leaves garbage for Zod to reject', () => {
    expect(normalizeResumeDate('sometime')).toBe('sometime');
  });
});
