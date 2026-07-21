import { OnsAsheProvider } from './ons-ashe.provider';

describe('OnsAsheProvider', () => {
  const provider = new OnsAsheProvider();

  it('matches solutions architect titles', () => {
    const band = provider.lookup('Solutions Architect');
    expect(band).not.toBeNull();
    expect(band?.source).toBe('ons_ashe');
    expect(band?.currency).toBe('GBP');
    expect(band!.min).toBeLessThan(band!.max!);
  });

  it('returns null for unknown titles', () => {
    expect(provider.lookup('Underwater Basket Weaver')).toBeNull();
  });
});
