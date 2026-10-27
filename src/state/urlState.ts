/**
 * FinLens URL State Serializer
 *
 * Encodes and decodes financial calculator state directly to/from
 * URL query parameters for instant 1-click sharing.
 */

export interface SerializedState {
  view?: 'single' | 'arena';
  tab?: 'fdr' | 'dps' | 'emi';
  currency?: string;
  numberSystem?: 'south-asian' | 'international';
  // FDR
  f_p?: number; // principal
  f_r?: number; // annual rate
  f_m?: number; // tenure months
  f_c?: string; // compounding
  f_t?: number; // tax pct
  f_f?: number; // annual fee
  f_i?: number; // inflation pct
  // DPS
  d_m?: number; // monthly installment
  d_r?: number; // annual rate
  d_y?: number; // tenure years
  d_c?: string; // compounding
  d_t?: number; // tax pct
  d_f?: number; // fee
  d_i?: number; // inflation
  // EMI
  e_p?: number; // loan principal
  e_r?: number; // rate
  e_m?: number; // tenure months
  e_x?: number; // extra monthly
  e_l?: number; // yearly lump sum
}

/**
 * Build shareable URL query string from state.
 */
export function serializeStateToQuery(state: SerializedState): string {
  const params = new URLSearchParams();

  if (state.view) params.set('v', state.view);
  if (state.tab) params.set('t', state.tab);
  if (state.currency) params.set('curr', state.currency);
  if (state.numberSystem) params.set('num', state.numberSystem);

  // FDR
  if (state.f_p !== undefined) params.set('fp', state.f_p.toString());
  if (state.f_r !== undefined) params.set('fr', state.f_r.toString());
  if (state.f_m !== undefined) params.set('fm', state.f_m.toString());
  if (state.f_c !== undefined) params.set('fc', state.f_c);
  if (state.f_t !== undefined) params.set('ft', state.f_t.toString());
  if (state.f_f !== undefined) params.set('ff', state.f_f.toString());
  if (state.f_i !== undefined) params.set('fi', state.f_i.toString());

  // DPS
  if (state.d_m !== undefined) params.set('dm', state.d_m.toString());
  if (state.d_r !== undefined) params.set('dr', state.d_r.toString());
  if (state.d_y !== undefined) params.set('dy', state.d_y.toString());
  if (state.d_c !== undefined) params.set('dc', state.d_c);
  if (state.d_t !== undefined) params.set('dt', state.d_t.toString());
  if (state.d_f !== undefined) params.set('df', state.d_f.toString());
  if (state.d_i !== undefined) params.set('di', state.d_i.toString());

  // EMI
  if (state.e_p !== undefined) params.set('ep', state.e_p.toString());
  if (state.e_r !== undefined) params.set('er', state.e_r.toString());
  if (state.e_m !== undefined) params.set('em', state.e_m.toString());
  if (state.e_x !== undefined) params.set('ex', state.e_x.toString());
  if (state.e_l !== undefined) params.set('el', state.e_l.toString());

  return params.toString();
}

/**
 * Parse URL query string into typed state.
 */
export function deserializeQueryToState(queryString: string): SerializedState {
  const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
  const state: SerializedState = {};

  const v = params.get('v');
  if (v === 'single' || v === 'arena') state.view = v;

  const t = params.get('t');
  if (t === 'fdr' || t === 'dps' || t === 'emi') state.tab = t;

  const curr = params.get('curr');
  if (curr) state.currency = curr;

  const num = params.get('num');
  if (num === 'south-asian' || num === 'international') state.numberSystem = num;

  // FDR
  if (params.has('fp')) state.f_p = parseFloat(params.get('fp')!);
  if (params.has('fr')) state.f_r = parseFloat(params.get('fr')!);
  if (params.has('fm')) state.f_m = parseInt(params.get('fm')!, 10);
  if (params.has('fc')) state.f_c = params.get('fc')!;
  if (params.has('ft')) state.f_t = parseFloat(params.get('ft')!);
  if (params.has('ff')) state.f_f = parseFloat(params.get('ff')!);
  if (params.has('fi')) state.f_i = parseFloat(params.get('fi')!);

  // DPS
  if (params.has('dm')) state.d_m = parseFloat(params.get('dm')!);
  if (params.has('dr')) state.d_r = parseFloat(params.get('dr')!);
  if (params.has('dy')) state.d_y = parseInt(params.get('dy')!, 10);
  if (params.has('dc')) state.d_c = params.get('dc')!;
  if (params.has('dt')) state.d_t = parseFloat(params.get('dt')!);
  if (params.has('df')) state.d_f = parseFloat(params.get('df')!);
  if (params.has('di')) state.d_i = parseFloat(params.get('di')!);

  // EMI
  if (params.has('ep')) state.e_p = parseFloat(params.get('ep')!);
  if (params.has('er')) state.e_r = parseFloat(params.get('er')!);
  if (params.has('em')) state.e_m = parseInt(params.get('em')!, 10);
  if (params.has('ex')) state.e_x = parseFloat(params.get('ex')!);
  if (params.has('el')) state.e_l = parseFloat(params.get('el')!);

  return state;
}

/**
 * Generate full share URL and copy to clipboard.
 */
export async function copyShareableLink(state: SerializedState): Promise<string> {
  const query = serializeStateToQuery(state);
  const url = `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ''}`;

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(url);
  }
  return url;
}
