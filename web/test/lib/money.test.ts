import { toMinorUnits } from '../../src/lib/money.ts';
import { describe, expect, it } from 'vitest';

describe('toMinorUnits', () => {
  it('converts major units to integer minor units', () => {
    expect(toMinorUnits('42.00')).toBe(4_200);
    expect(toMinorUnits('42.5')).toBe(4_250);
    expect(toMinorUnits('0.99')).toBe(99);
    expect(toMinorUnits('100')).toBe(10_000);
  });

  it('rounds to the nearest minor unit', () => {
    expect(toMinorUnits('7.999')).toBe(800);
  });

  it('yields NaN for non-numeric input (the Worker schema rejects it)', () => {
    expect(toMinorUnits('abc')).toBeNaN();
  });
});
