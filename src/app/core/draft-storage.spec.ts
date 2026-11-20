import { sanitizeDraft } from './draft-storage';

describe('draft sanitizing', () => {
  it('returns null for missing data, invalid JSON and non objects', () => {
    expect(sanitizeDraft(null)).toBeNull();
    expect(sanitizeDraft('{oops')).toBeNull();
    expect(sanitizeDraft('42')).toBeNull();
    expect(sanitizeDraft('[]')).toBeNull();
  });

  it('cleans unknown ids, duplicates, wrong types and bad counts', () => {
    const raw = JSON.stringify({
      pickup: 'Z',
      dropoffs: ['B', 'B', 'C', 'D', 'E'],
      truckCategory: 'huge',
      truckCount: 9,
      cargoWeight: '5',
      pickupAt: 'not a date',
      loadingAssistance: 'yes',
    });
    const v = sanitizeDraft(raw)!;
    expect(v.pickup).toBe('');
    expect(v.dropoffs).toEqual(['B', '', 'C']); // max 3, duplicate blanked
    expect(v.truckCategory).toBe('medium');
    expect(v.truckCount).toBe(1);
    expect(v.cargoWeight).toBeNull();
    expect(v.pickupAt).toBe('');
    expect(v.loadingAssistance).toBeFalse();
  });

  it('keeps a good incomplete draft as it is', () => {
    const v = sanitizeDraft(JSON.stringify({ pickup: 'A', dropoffs: ['B'], truckCount: 3, truckCategory: 'large' }))!;
    expect(v.pickup).toBe('A');
    expect(v.dropoffs).toEqual(['B']);
    expect(v.truckCount).toBe(3);
    expect(v.truckCategory).toBe('large');
  });
});
