import {
  mergePreferencesIntoMetadata,
  patchMeSchema,
  preferencesFromMetadata,
} from './user.schema';

describe('user preferences (metadata)', () => {
  it('defaults autoGenerateTailoredCv to false when absent', () => {
    expect(preferencesFromMetadata(null)).toEqual({
      autoGenerateTailoredCv: false,
    });
    expect(preferencesFromMetadata({})).toEqual({
      autoGenerateTailoredCv: false,
    });
    expect(preferencesFromMetadata({ otherKey: 1 })).toEqual({
      autoGenerateTailoredCv: false,
    });
  });

  it('reads true only when explicitly true', () => {
    expect(
      preferencesFromMetadata({ autoGenerateTailoredCv: true }),
    ).toEqual({ autoGenerateTailoredCv: true });
    expect(
      preferencesFromMetadata({ autoGenerateTailoredCv: false }),
    ).toEqual({ autoGenerateTailoredCv: false });
    expect(
      preferencesFromMetadata({ autoGenerateTailoredCv: 'yes' }),
    ).toEqual({ autoGenerateTailoredCv: false });
  });

  it('merges prefs without wiping unrelated metadata keys', () => {
    const next = mergePreferencesIntoMetadata(
      { consultation: { goal: 'career-change' }, autoGenerateTailoredCv: false },
      { autoGenerateTailoredCv: true },
    );
    expect(next).toEqual({
      consultation: { goal: 'career-change' },
      autoGenerateTailoredCv: true,
    });
  });

  it('accepts PATCH preferences alone', () => {
    const parsed = patchMeSchema.parse({
      preferences: { autoGenerateTailoredCv: true },
    });
    expect(parsed.preferences?.autoGenerateTailoredCv).toBe(true);
  });
});
