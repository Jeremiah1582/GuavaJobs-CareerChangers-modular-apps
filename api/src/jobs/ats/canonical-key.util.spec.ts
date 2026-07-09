import {
  buildAdzunaKey,
  buildCanonicalKey,
  parseCanonicalKey,
} from './canonical-key.util';

describe('canonical-key.util', () => {
  it('builds greenhouse key', () => {
    expect(buildCanonicalKey('greenhouse', 'acme', '12345')).toBe(
      'greenhouse:acme:12345',
    );
  });

  it('builds adzuna key with lowercase country', () => {
    expect(buildAdzunaKey('GB', '98765')).toBe('adzuna:gb:98765');
  });

  it('parses valid canonical key', () => {
    expect(parseCanonicalKey('greenhouse:acme:12345')).toEqual({
      atsType: 'greenhouse',
      board: 'acme',
      jobId: '12345',
    });
  });

  it('parses key with colon in board segment', () => {
    expect(parseCanonicalKey('lever:my:board:job-id')).toEqual({
      atsType: 'lever',
      board: 'my:board',
      jobId: 'job-id',
    });
  });

  it('returns null for invalid key', () => {
    expect(parseCanonicalKey('invalid')).toBeNull();
    expect(parseCanonicalKey('a:b')).toBeNull();
  });
});
