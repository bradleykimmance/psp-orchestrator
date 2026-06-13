import { cardBrand } from '../../src/lib/cardBrand.ts';
import { describe, expect, it } from 'vitest';

describe('cardBrand', () => {
  it('reads the network from the leading digits', () => {
    expect(cardBrand('4242424242424242')).toBe('visa');
    expect(cardBrand('5555555555554444')).toBe('mastercard');
    expect(cardBrand('2223003122003222')).toBe('mastercard');
    expect(cardBrand('371449635398431')).toBe('amex');
  });

  it('detects as digits arrive, ignoring spaces', () => {
    expect(cardBrand('4')).toBe('visa');
    expect(cardBrand('5105 1051 0510')).toBe('mastercard');
  });

  it('falls back to unknown for anything unrecognised', () => {
    expect(cardBrand('')).toBe('unknown');
    expect(cardBrand('6011000990139424')).toBe('unknown');
  });
});
