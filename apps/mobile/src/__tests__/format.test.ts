import { formatCurrency, formatPhone, formatDistance } from '../lib/format';

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0');
    expect(formatCurrency(0)).toContain('FCFA');
  });

  it('formats large amounts with separators', () => {
    const result = formatCurrency(150000);
    expect(result).toContain('FCFA');
    expect(result).toMatch(/150/);
  });

  it('includes FCFA suffix', () => {
    expect(formatCurrency(5000)).toContain('FCFA');
  });
});

describe('formatPhone', () => {
  it('formats Ivory Coast number', () => {
    const result = formatPhone('+2250700112233');
    expect(result).toBe('+225 07 00 11 22 33');
  });

  it('returns non-CI numbers unchanged', () => {
    expect(formatPhone('+33612345678')).toBe('+33612345678');
  });
});

describe('formatDistance', () => {
  it('formats meters below 1000', () => {
    expect(formatDistance(500)).toBe('500 m');
  });

  it('formats kilometers', () => {
    expect(formatDistance(2500)).toBe('2.5 km');
  });
});
