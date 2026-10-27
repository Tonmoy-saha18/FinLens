import { describe, it, expect } from 'vitest';
import {
  serializeStateToQuery,
  deserializeQueryToState,
  type SerializedState,
} from './urlState';

describe('URL State Serialization', () => {
  it('correctly serializes FDR parameters to URL query', () => {
    const state: SerializedState = {
      view: 'single',
      tab: 'fdr',
      currency: 'BDT',
      numberSystem: 'south-asian',
      f_p: 250000,
      f_r: 10.5,
      f_m: 24,
      f_c: 'quarterly',
      f_t: 10,
      f_f: 500,
      f_i: 6,
    };

    const query = serializeStateToQuery(state);
    expect(query).toContain('v=single');
    expect(query).toContain('t=fdr');
    expect(query).toContain('fp=250000');
    expect(query).toContain('fr=10.5');
    expect(query).toContain('fm=24');
    expect(query).toContain('fc=quarterly');

    const decoded = deserializeQueryToState(query);
    expect(decoded.f_p).toBe(250000);
    expect(decoded.f_r).toBe(10.5);
    expect(decoded.f_m).toBe(24);
    expect(decoded.f_c).toBe('quarterly');
    expect(decoded.currency).toBe('BDT');
  });

  it('correctly round-trips EMI prepayment parameters', () => {
    const state: SerializedState = {
      view: 'single',
      tab: 'emi',
      e_p: 5000000,
      e_r: 9.0,
      e_m: 240,
      e_x: 5000,
      e_l: 50000,
    };

    const query = serializeStateToQuery(state);
    const decoded = deserializeQueryToState(`?${query}`);

    expect(decoded.tab).toBe('emi');
    expect(decoded.e_p).toBe(5000000);
    expect(decoded.e_r).toBe(9.0);
    expect(decoded.e_m).toBe(240);
    expect(decoded.e_x).toBe(5000);
    expect(decoded.e_l).toBe(50000);
  });

  it('handles empty query gracefully', () => {
    const decoded = deserializeQueryToState('');
    expect(decoded).toEqual({});
  });
});
