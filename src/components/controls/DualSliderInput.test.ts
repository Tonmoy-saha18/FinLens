import { describe, it, expect } from 'vitest';
import { parseFlexibleNumber } from './DualSliderInput';

describe('Flexible Number Input Parsing', () => {
  it('parses standard numbers and decimals', () => {
    expect(parseFlexibleNumber('1000')).toBe(1000);
    expect(parseFlexibleNumber('50000.5')).toBe(50000.5);
    expect(parseFlexibleNumber('0')).toBe(0);
  });

  it('parses numbers with commas', () => {
    expect(parseFlexibleNumber('1,00,000')).toBe(100000);
    expect(parseFlexibleNumber('10,000,000')).toBe(10000000);
    expect(parseFlexibleNumber('25,000.75')).toBe(25000.75);
  });

  it('parses thousand (k / K) shorthand', () => {
    expect(parseFlexibleNumber('50k')).toBe(50000);
    expect(parseFlexibleNumber('25.5K')).toBe(25500);
    expect(parseFlexibleNumber('100 k')).toBe(100000);
  });

  it('parses Lakh (L / lac / lakh) shorthand', () => {
    expect(parseFlexibleNumber('5L')).toBe(500000);
    expect(parseFlexibleNumber('2.5l')).toBe(250000);
    expect(parseFlexibleNumber('10 lakh')).toBe(1000000);
    expect(parseFlexibleNumber('15.5 lac')).toBe(1550000);
  });

  it('parses Crore (Cr / crore) shorthand', () => {
    expect(parseFlexibleNumber('1Cr')).toBe(10000000);
    expect(parseFlexibleNumber('2.5cr')).toBe(25000000);
    expect(parseFlexibleNumber('0.5 crore')).toBe(5000000);
  });

  it('parses Million (M / mn) shorthand', () => {
    expect(parseFlexibleNumber('2M')).toBe(2000000);
    expect(parseFlexibleNumber('1.5m')).toBe(1500000);
    expect(parseFlexibleNumber('10 mn')).toBe(10000000);
  });

  it('handles invalid inputs gracefully', () => {
    expect(parseFlexibleNumber('')).toBeNull();
    expect(parseFlexibleNumber('   ')).toBeNull();
    expect(parseFlexibleNumber('abc')).toBeNull();
  });
});
