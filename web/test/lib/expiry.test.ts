import { formatExpiry, toMMYY } from '../../src/lib/expiry.ts';
import { describe, expect, it } from 'vitest';

describe('formatExpiry', () => {
  it('pads a leading month above 1 so the slash advances on its own', () => {
    expect(formatExpiry('5')).toBe('05');
  });

  it('leaves 0 or 1 unpadded while a second month digit may still follow', () => {
    expect(formatExpiry('0')).toBe('0');
    expect(formatExpiry('1')).toBe('1');
  });

  it('inserts the separator once the month is complete', () => {
    expect(formatExpiry('122')).toBe('12 / 2');
    expect(formatExpiry('1227')).toBe('12 / 27');
  });

  it('ignores non-digits and caps at four digits', () => {
    expect(formatExpiry('12/27')).toBe('12 / 27');
    expect(formatExpiry('12 / 2799')).toBe('12 / 27');
    expect(formatExpiry('ab12cd27ef')).toBe('12 / 27');
  });
});

describe('toMMYY', () => {
  it('strips the mask down to the four digits the Worker expects', () => {
    expect(toMMYY('12 / 27')).toBe('1227');
    expect(toMMYY('03 / 30')).toBe('0330');
  });
});
