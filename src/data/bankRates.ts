import { type CompoundingFrequency } from '@/engine/types';

export type InstitutionType = 'govt' | 'private-commercial' | 'islamic' | 'nbfi' | 'multinational';
export type CreditRating = 'Sovereign (0% Risk)' | 'AAA (Highest)' | 'AA+ (Very High)' | 'AA (High)' | 'A+ (Good)';
export type SchemeType = 'fdr' | 'dps' | 'loan';
export type LoanSubCategory = 'home' | 'personal' | 'auto';

export interface BankInstitution {
  id: string;
  name: string;
  shortName: string;
  type: InstitutionType;
  typeLabel: string;
  creditRating: CreditRating;
  safetyScore: number; // 0 to 100
  safetyTier: 'Sovereign Guarantee' | 'Highest Tier Safety' | 'Strong Safety' | 'Moderate / Higher Yield';
  description: string;
  depositInsuranceCovered: boolean; // BD Bank insurance up to ৳2 Lakh
  website?: string;
}

export interface BankScheme {
  id: string;
  bankId: string;
  bankName: string;
  bankShort: string;
  institutionType: InstitutionType;
  creditRating: CreditRating;
  safetyScore: number;
  schemeName: string;
  type: SchemeType;
  loanCategory?: LoanSubCategory;
  headlineRate: number; // e.g. 10.50
  rateRangeDisplay: string; // e.g. "10.50% - 11.00%"
  rateType: 'Fixed Rate' | 'Floating / Market' | 'Mudaraba Profit Sharing';
  tenureDisplay: string;
  tenureMonthsMin: number;
  tenureMonthsMax: number;
  defaultTenureMonths: number;
  minAmount: number;
  defaultAmount: number;
  compounding: CompoundingFrequency;
  isIslamic: boolean;
  isGovtBacked: boolean;
  featuredBadge?: 'Editor Pick' | 'Highest Return' | 'Safest Capital' | 'Best Halal' | 'Lowest EMI' | 'Popular';
  highlights: string[];
  pros: string[];
  cons: string[];
  whyConsider: string;
  taxNote: string;
  calculatorDefaults: {
    tab: 'fdr' | 'dps' | 'emi';
    principal?: number;
    annualRate: number;
    tenureMonths: number;
    compounding?: CompoundingFrequency;
    monthlyInstallment?: number;
    stepUpPercent?: number;
    loanPrincipal?: number;
    extraMonthly?: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. INSTITUTIONS DIRECTORY
// ─────────────────────────────────────────────────────────────────────────────

export const BANK_INSTITUTIONS: Record<string, BankInstitution> = {
  'bd-govt': {
    id: 'bd-govt',
    name: 'Government of Bangladesh (National Savings Directorate)',
    shortName: 'Bangladesh Sanchayapatra',
    type: 'govt',
    typeLabel: 'Government / Sovereign',
    creditRating: 'Sovereign (0% Risk)',
    safetyScore: 100,
    safetyTier: 'Sovereign Guarantee',
    description: '100% sovereign-guaranteed national savings certificates managed by Bangladesh Bank & Internal Resources Division.',
    depositInsuranceCovered: true,
  },
  'brac': {
    id: 'brac',
    name: 'BRAC Bank PLC',
    shortName: 'BRAC Bank',
    type: 'private-commercial',
    typeLabel: 'Top Private Commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 97,
    safetyTier: 'Highest Tier Safety',
    description: 'Premier private commercial bank in Bangladesh with industry-leading corporate governance and SME/retail depth.',
    depositInsuranceCovered: true,
  },
  'city': {
    id: 'city',
    name: 'The City Bank PLC',
    shortName: 'City Bank',
    type: 'private-commercial',
    typeLabel: 'Top Private Commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 95,
    safetyTier: 'Highest Tier Safety',
    description: 'Leading commercial bank, American Express franchisee, offering aggressive deposit yields and innovative digital services.',
    depositInsuranceCovered: true,
  },
  'ebl': {
    id: 'ebl',
    name: 'Eastern Bank PLC',
    shortName: 'Eastern Bank (EBL)',
    type: 'private-commercial',
    typeLabel: 'Top Private Commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 96,
    safetyTier: 'Highest Tier Safety',
    description: 'Renowned for prime asset quality, exceptionally low non-performing loans (NPLs), and premium corporate/retail banking.',
    depositInsuranceCovered: true,
  },
  'dbbl': {
    id: 'dbbl',
    name: 'Dutch-Bangla Bank PLC',
    shortName: 'Dutch-Bangla Bank (DBBL)',
    type: 'private-commercial',
    typeLabel: 'Top Private Commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 95,
    safetyTier: 'Highest Tier Safety',
    description: 'Largest ATM and digital retail financial network in Bangladesh with the most competitive home mortgage rates.',
    depositInsuranceCovered: true,
  },
  'shahjalal': {
    id: 'shahjalal',
    name: 'Shahjalal Islami Bank PLC',
    shortName: 'Shahjalal Islami Bank',
    type: 'islamic',
    typeLabel: 'Shariah-Compliant Islamic',
    creditRating: 'AA+ (Very High)',
    safetyScore: 92,
    safetyTier: 'Strong Safety',
    description: 'Top-performing Islamic bank operating under strict Shariah Mudaraba principles with superior liquidity management.',
    depositInsuranceCovered: true,
  },
  'idlc': {
    id: 'idlc',
    name: 'IDLC Finance PLC',
    shortName: 'IDLC Finance',
    type: 'nbfi',
    typeLabel: 'Tier-1 NBFI',
    creditRating: 'AAA (Highest)',
    safetyScore: 94,
    safetyTier: 'Highest Tier Safety',
    description: 'Largest multi-product non-banking financial institution with AAA credit rating and higher deposit returns.',
    depositInsuranceCovered: false, // NBFIs operate under separate NBFI regulatory provisions
  },
  'ipdc': {
    id: 'ipdc',
    name: 'IPDC Finance PLC',
    shortName: 'IPDC Finance',
    type: 'nbfi',
    typeLabel: 'Tier-1 NBFI',
    creditRating: 'AA+ (Very High)',
    safetyScore: 90,
    safetyTier: 'Moderate / Higher Yield',
    description: 'The first private sector financial institution in Bangladesh offering attractive deposit pension and term rates.',
    depositInsuranceCovered: false,
  },
  'sonali': {
    id: 'sonali',
    name: 'Sonali Bank PLC',
    shortName: 'Sonali Bank',
    type: 'govt',
    typeLabel: 'State-Owned Commercial',
    creditRating: 'Sovereign (0% Risk)',
    safetyScore: 98,
    safetyTier: 'Sovereign Guarantee',
    description: 'Largest state-owned bank in Bangladesh with 1,200+ branches and full sovereign backing for depositors.',
    depositInsuranceCovered: true,
  },
  'scb': {
    id: 'scb',
    name: 'Standard Chartered Bank Bangladesh',
    shortName: 'Standard Chartered',
    type: 'multinational',
    typeLabel: 'Multinational Bank',
    creditRating: 'AAA (Highest)',
    safetyScore: 98,
    safetyTier: 'Highest Tier Safety',
    description: 'Oldest and largest international foreign commercial bank in Bangladesh with global tier-1 capital reserves.',
    depositInsuranceCovered: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SCHEMES & PRODUCTS DIRECTORY
// ─────────────────────────────────────────────────────────────────────────────

export const BANK_SCHEMES: BankScheme[] = [
  // ── FDR / Fixed Deposit Schemes ──
  {
    id: 'sanchayapatra-5yr',
    bankId: 'bd-govt',
    bankName: 'Government of Bangladesh',
    bankShort: 'National Savings (সঞ্চয়পত্র)',
    institutionType: 'govt',
    creditRating: 'Sovereign (0% Risk)',
    safetyScore: 100,
    schemeName: '5-Year Bangladesh Sanchayapatra',
    type: 'fdr',
    headlineRate: 11.52,
    rateRangeDisplay: '11.04% - 11.52%',
    rateType: 'Fixed Rate',
    tenureDisplay: '5 Years (60 Months)',
    tenureMonthsMin: 60,
    tenureMonthsMax: 60,
    defaultTenureMonths: 60,
    minAmount: 50000,
    defaultAmount: 500000,
    compounding: 'monthly',
    isIslamic: false,
    isGovtBacked: true,
    featuredBadge: 'Safest Capital',
    highlights: [
      '100% sovereign government guarantee (Zero default risk)',
      '11.52% rate up to ৳15 Lakh investment',
      'Option for monthly profit withdrawal to your bank account',
      'Premature encashment permitted after 1st year with tiered rates',
    ],
    pros: [
      'Highest guaranteed fixed yield in Bangladesh without credit risk',
      'Backed directly by the Ministry of Finance / Bangladesh Bank',
      'Immune to any commercial bank liquidity or bankruptcy concerns',
    ],
    cons: [
      'Individual investment ceiling (Max ৳30L single, ৳60L joint)',
      'Rates tier down to 10.50% for investments exceeding ৳15 Lakh',
      'Must be purchased through Bangladesh Bank, Post Office, or designated branches',
    ],
    whyConsider:
      'The undisputed best plan if you have a lump sum under ৳30-50 Lakh. It offers the highest legal risk-free return in Bangladesh, easily beating private bank deposit rates and protecting capital against inflation.',
    taxNote: 'Source Tax: 5% on profit if total investment ≤ ৳5 Lakh; 10% if > ৳5 Lakh.',
    calculatorDefaults: {
      tab: 'fdr',
      principal: 500000,
      annualRate: 11.52,
      tenureMonths: 60,
      compounding: 'monthly',
    },
  },
  {
    id: 'brac-high-yield-fdr',
    bankId: 'brac',
    bankName: 'BRAC Bank PLC',
    bankShort: 'BRAC Bank',
    institutionType: 'private-commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 97,
    schemeName: 'High-Yield Term Deposit (FDR)',
    type: 'fdr',
    headlineRate: 10.75,
    rateRangeDisplay: '10.25% - 11.00%',
    rateType: 'Fixed Rate',
    tenureDisplay: '3 Months to 3 Years',
    tenureMonthsMin: 3,
    tenureMonthsMax: 36,
    defaultTenureMonths: 12,
    minAmount: 50000,
    defaultAmount: 200000,
    compounding: 'quarterly',
    isIslamic: false,
    isGovtBacked: false,
    featuredBadge: 'Editor Pick',
    highlights: [
      'AAA credit rating with top-tier balance sheet strength',
      'Instant loan up to 90% against FDR via Astha Mobile App',
      'Flexible compounding frequencies (Monthly payout or Quarterly growth)',
      'Automated renewal options with principal or principal+interest roll',
    ],
    pros: [
      'Pristine institutional safety with lowest governance risk in private banking',
      'High liquidity: You can borrow against it in 2 minutes via online app',
      'Beats prevailing inflation (~9.5%) after tax deductions',
    ],
    cons: [
      'Rate is ~0.5% lower than non-bank financial institutions (NBFIs)',
      'Premature encashment reverts profit to basic savings rate',
    ],
    whyConsider:
      'The best commercial bank choice for risk-conscious depositors wanting top interest rates (~10.75%) without compromising on safety, governance, or digital convenience.',
    taxNote: '10% AIT with TIN return submission receipt (PSR); 15% without PSR.',
    calculatorDefaults: {
      tab: 'fdr',
      principal: 200000,
      annualRate: 10.75,
      tenureMonths: 12,
      compounding: 'quarterly',
    },
  },
  {
    id: 'city-maxyield-fdr',
    bankId: 'city',
    bankName: 'The City Bank PLC',
    bankShort: 'City Bank',
    institutionType: 'private-commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 95,
    schemeName: 'City MaxYield Fixed Deposit',
    type: 'fdr',
    headlineRate: 11.00,
    rateRangeDisplay: '10.50% - 11.25%',
    rateType: 'Fixed Rate',
    tenureDisplay: '6 Months to 3 Years',
    tenureMonthsMin: 6,
    tenureMonthsMax: 36,
    defaultTenureMonths: 12,
    minAmount: 100000,
    defaultAmount: 300000,
    compounding: 'quarterly',
    isIslamic: false,
    isGovtBacked: false,
    featuredBadge: 'Popular',
    highlights: [
      'Aggressive rate structure up to 11.00% for 12-month tenure',
      'Overdraft & Citygem priority banking perks for deposits > ৳25 Lakh',
      'CityTouch internet banking instant certificate generation',
    ],
    pros: [
      'Among the most competitive interest rates among Tier-1 private banks',
      'Complimentary City Bank American Express credit card eligibility',
    ],
    cons: [
      'Minimum deposit threshold is ৳100,000 for top interest tier',
      'Excise duty applies if balance crosses year-end thresholds',
    ],
    whyConsider:
      'Ideal for depositors looking to squeeze the highest yield possible out of an AAA-rated private commercial bank.',
    taxNote: '10% AIT with TIN return proof; 15% without proof.',
    calculatorDefaults: {
      tab: 'fdr',
      principal: 300000,
      annualRate: 11.00,
      tenureMonths: 12,
      compounding: 'quarterly',
    },
  },
  {
    id: 'idlc-term-deposit',
    bankId: 'idlc',
    bankName: 'IDLC Finance PLC',
    bankShort: 'IDLC Finance',
    institutionType: 'nbfi',
    creditRating: 'AAA (Highest)',
    safetyScore: 94,
    schemeName: 'IDLC Regular Term Deposit',
    type: 'fdr',
    headlineRate: 11.50,
    rateRangeDisplay: '11.00% - 11.75%',
    rateType: 'Fixed Rate',
    tenureDisplay: '3 Months to 5 Years',
    tenureMonthsMin: 3,
    tenureMonthsMax: 60,
    defaultTenureMonths: 24,
    minAmount: 50000,
    defaultAmount: 500000,
    compounding: 'quarterly',
    isIslamic: false,
    isGovtBacked: false,
    featuredBadge: 'Highest Return',
    highlights: [
      'Top corporate governance among all NBFIs with AAA rating',
      '11.50% return: Significantly higher than conventional commercial banks',
      'Monthly interest payout or cumulative reinvestment schemes available',
    ],
    pros: [
      'Higher returns than traditional banks for the same capital',
      'Impeccable track record of timely maturity payment over 35+ years',
    ],
    cons: [
      'Not a commercial bank: Cannot issue cheque books or general demand deposits',
      'No Bangladesh Bank Deposit Insurance coverage (NBFIs excluded)',
    ],
    whyConsider:
      'Worth considering if you have already exhausted your Sanchayapatra quota and want higher yields (11.50%) without touching lower-tier questionable banks.',
    taxNote: 'Standard 10% AIT with TIN return submission; 15% without.',
    calculatorDefaults: {
      tab: 'fdr',
      principal: 500000,
      annualRate: 11.50,
      tenureMonths: 24,
      compounding: 'quarterly',
    },
  },
  {
    id: 'shahjalal-mtdr',
    bankId: 'shahjalal',
    bankName: 'Shahjalal Islami Bank PLC',
    bankShort: 'Shahjalal Islami Bank',
    institutionType: 'islamic',
    creditRating: 'AA+ (Very High)',
    safetyScore: 92,
    schemeName: 'Mudaraba Term Deposit (MTDR)',
    type: 'fdr',
    headlineRate: 10.50,
    rateRangeDisplay: '10.00% - 10.75%',
    rateType: 'Mudaraba Profit Sharing',
    tenureDisplay: '3 Months to 3 Years',
    tenureMonthsMin: 3,
    tenureMonthsMax: 36,
    defaultTenureMonths: 12,
    minAmount: 50000,
    defaultAmount: 250000,
    compounding: 'quarterly',
    isIslamic: true,
    isGovtBacked: false,
    featuredBadge: 'Best Halal',
    highlights: [
      '100% Shariah-compliant under certified Islamic Supervisory Board',
      'Profit weightage system providing stable 10.50% annualized yield',
      'Quard (Islamic overdraft loan) facility up to 80% of deposit',
    ],
    pros: [
      'Completely Halal, interest-free (Riba-free) profit distribution',
      'One of the strongest and most liquid Islamic banks in Bangladesh',
    ],
    cons: [
      'Profit rate is provisional based on bank earnings, though historical payouts are stable',
    ],
    whyConsider:
      'The premier choice for depositors seeking 100% Shariah-compliant profit without compromising on bank stability or yield.',
    taxNote: '10% AIT with TIN return slip; 15% without.',
    calculatorDefaults: {
      tab: 'fdr',
      principal: 250000,
      annualRate: 10.50,
      tenureMonths: 12,
      compounding: 'quarterly',
    },
  },
  {
    id: 'sonali-fdr',
    bankId: 'sonali',
    bankName: 'Sonali Bank PLC',
    bankShort: 'Sonali Bank',
    institutionType: 'govt',
    creditRating: 'Sovereign (0% Risk)',
    safetyScore: 98,
    schemeName: 'Sonali Fixed Term Deposit',
    type: 'fdr',
    headlineRate: 9.25,
    rateRangeDisplay: '9.00% - 9.50%',
    rateType: 'Fixed Rate',
    tenureDisplay: '3 Months to 3 Years',
    tenureMonthsMin: 3,
    tenureMonthsMax: 36,
    defaultTenureMonths: 12,
    minAmount: 10000,
    defaultAmount: 100000,
    compounding: 'quarterly',
    isIslamic: false,
    isGovtBacked: true,
    highlights: [
      'State-owned commercial bank with absolute sovereign security',
      'Nationwide presence with 1,200+ branches even in remote sub-districts',
    ],
    pros: [
      'Virtually zero risk of institutional default (State guaranteed)',
      'Lowest minimum deposit requirement (৳10,000)',
    ],
    cons: [
      'Interest rate (9.25%) barely matches inflation (~9.5%), resulting in flat real growth',
      'Slower branch services compared to private modern banks',
    ],
    whyConsider:
      'Best for rural depositors or extremely conservative public servants who insist on public-sector banking, though private banks and Sanchayapatra offer 1.5-2.2% higher returns.',
    taxNote: '10% AIT with TIN return; 15% without.',
    calculatorDefaults: {
      tab: 'fdr',
      principal: 100000,
      annualRate: 9.25,
      tenureMonths: 12,
      compounding: 'quarterly',
    },
  },

  // ── DPS / Recurring Monthly Schemes ──
  {
    id: 'brac-future-star-dps',
    bankId: 'brac',
    bankName: 'BRAC Bank PLC',
    bankShort: 'BRAC Bank',
    institutionType: 'private-commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 97,
    schemeName: 'Prothom / Future Star DPS',
    type: 'dps',
    headlineRate: 10.25,
    rateRangeDisplay: '9.50% - 10.50%',
    rateType: 'Fixed Rate',
    tenureDisplay: '1 to 10 Years',
    tenureMonthsMin: 12,
    tenureMonthsMax: 120,
    defaultTenureMonths: 60,
    minAmount: 1000,
    defaultAmount: 5000,
    compounding: 'monthly',
    isIslamic: false,
    isGovtBacked: false,
    featuredBadge: 'Editor Pick',
    highlights: [
      'Auto-debit from your savings account every month with zero penalty grace period',
      'Tenures from 1 to 10 years with compounding applied monthly',
      'Loan facility up to 90% against accumulated balance at nominal spread',
    ],
    pros: [
      'Superb digital management: Open and monitor directly through BRAC Astha app',
      'AAA safety: Guaranteed wealth accumulation over 5 to 10 year horizons',
      'Compound interest turns ৳5,000/mo into over ৳4.2 Lakh in 5 yrs and ৳10.3 Lakh in 10 yrs',
    ],
    cons: [
      'If you miss 3 consecutive installments, the account may be automatically encashed at basic savings rate',
    ],
    whyConsider:
      'The single best monthly wealth-building scheme for salaried professionals wanting automated, rock-solid compounding without visiting a branch.',
    taxNote: '10% AIT on accumulated profit with TIN return proof; 15% without.',
    calculatorDefaults: {
      tab: 'dps',
      monthlyInstallment: 5000,
      annualRate: 10.25,
      tenureMonths: 60,
      compounding: 'monthly',
      stepUpPercent: 0,
    },
  },
  {
    id: 'ebl-millionaire-dps',
    bankId: 'ebl',
    bankName: 'Eastern Bank PLC',
    bankShort: 'Eastern Bank (EBL)',
    institutionType: 'private-commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 96,
    schemeName: 'EBL Millionaire Scheme DPS',
    type: 'dps',
    headlineRate: 10.50,
    rateRangeDisplay: '10.00% - 10.75%',
    rateType: 'Fixed Rate',
    tenureDisplay: '3, 5, 7, or 10 Years to reach ৳10 Lakh / ৳1 Crore',
    tenureMonthsMin: 36,
    tenureMonthsMax: 120,
    defaultTenureMonths: 60,
    minAmount: 2000,
    defaultAmount: 10000,
    compounding: 'monthly',
    isIslamic: false,
    isGovtBacked: false,
    featuredBadge: 'Popular',
    highlights: [
      'Target-oriented deposit scheme engineered to reach ৳10 Lakh (Millionaire) or ৳1 Crore',
      'EBL priority banking and complimentary credit card on ৳10,000+/mo installments',
      'Monthly compounding guarantees exponential curve past Year 4',
    ],
    pros: [
      'Clear milestone focus makes it easy to stick to monthly savings disciplines',
      'AAA balance sheet gives complete peace of mind over long 10-year commitments',
    ],
    cons: [
      'Strict penalty for early closing before completing at least 1 year',
    ],
    whyConsider:
      'Worth considering if you have a specific financial goal (e.g. child higher education, buying a plot, retirement corpus) and want milestone-driven compounding.',
    taxNote: '10% AIT with TIN return proof; 15% without.',
    calculatorDefaults: {
      tab: 'dps',
      monthlyInstallment: 10000,
      annualRate: 10.50,
      tenureMonths: 60,
      compounding: 'monthly',
      stepUpPercent: 0,
    },
  },
  {
    id: 'city-shreshtho-dps',
    bankId: 'city',
    bankName: 'The City Bank PLC',
    bankShort: 'City Bank',
    institutionType: 'private-commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 95,
    schemeName: 'City Shreshtho DPS (with Free Life Insurance)',
    type: 'dps',
    headlineRate: 10.25,
    rateRangeDisplay: '9.75% - 10.50%',
    rateType: 'Fixed Rate',
    tenureDisplay: '3 to 10 Years',
    tenureMonthsMin: 36,
    tenureMonthsMax: 120,
    defaultTenureMonths: 60,
    minAmount: 2000,
    defaultAmount: 5000,
    compounding: 'monthly',
    isIslamic: false,
    isGovtBacked: false,
    featuredBadge: 'Highest Return',
    highlights: [
      'Complimentary Life Insurance coverage up to ৳10 Lakh included at zero extra cost',
      'In case of depositor demise, insurance company pays remaining installments for nominee',
      'Competitive 10.25% compounding rate',
    ],
    pros: [
      'Built-in family protection: Guarantees your family gets full maturity value even if you pass away',
      'High 10.25% rate combined with insurance makes it extraordinary value',
    ],
    cons: [
      'Insurance claim requires medical declaration and age eligibility (18-55 years)',
    ],
    whyConsider:
      'The top recommendation for family breadwinners. You get high investment growth plus life insurance security for your family without buying a separate costly policy.',
    taxNote: '10% AIT with TIN return; 15% without.',
    calculatorDefaults: {
      tab: 'dps',
      monthlyInstallment: 5000,
      annualRate: 10.25,
      tenureMonths: 60,
      compounding: 'monthly',
      stepUpPercent: 0,
    },
  },
  {
    id: 'shahjalal-dps',
    bankId: 'shahjalal',
    bankName: 'Shahjalal Islami Bank PLC',
    bankShort: 'Shahjalal Islami Bank',
    institutionType: 'islamic',
    creditRating: 'AA+ (Very High)',
    safetyScore: 92,
    schemeName: 'Mudaraba Monthly Deposit Scheme (DPS)',
    type: 'dps',
    headlineRate: 10.25,
    rateRangeDisplay: '9.75% - 10.50%',
    rateType: 'Mudaraba Profit Sharing',
    tenureDisplay: '3 to 10 Years',
    tenureMonthsMin: 36,
    tenureMonthsMax: 120,
    defaultTenureMonths: 60,
    minAmount: 1000,
    defaultAmount: 5000,
    compounding: 'monthly',
    isIslamic: true,
    isGovtBacked: false,
    featuredBadge: 'Best Halal',
    highlights: [
      '100% Halal Shariah compliance audited by Islamic scholars',
      'Funds deployed strictly into halal trade finance, manufacturing, and real estate',
      'Provisional rate weightage gives actual returns equal to conventional 10.25%',
    ],
    pros: [
      'Ethical, interest-free Islamic wealth creation',
      'Flexible monthly amounts starting from just ৳1,000',
    ],
    cons: [
      'No fixed interest guarantee by Shariah definition, though returns are historically consistent',
    ],
    whyConsider:
      'The #1 halal monthly savings scheme in Bangladesh. Enables you to accumulate wealth ethically with zero riba.',
    taxNote: '10% AIT with TIN return proof; 15% without.',
    calculatorDefaults: {
      tab: 'dps',
      monthlyInstallment: 5000,
      annualRate: 10.25,
      tenureMonths: 60,
      compounding: 'monthly',
      stepUpPercent: 0,
    },
  },

  // ── Loan Schemes (Home, Personal, Auto) ──
  {
    id: 'dbbl-home-loan',
    bankId: 'dbbl',
    bankName: 'Dutch-Bangla Bank PLC',
    bankShort: 'DBBL',
    institutionType: 'private-commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 95,
    schemeName: 'DBBL Affordable Home Loan',
    type: 'loan',
    loanCategory: 'home',
    headlineRate: 12.50,
    rateRangeDisplay: '12.00% - 13.00%',
    rateType: 'Floating / Market',
    tenureDisplay: 'Up to 25 Years (300 Months)',
    tenureMonthsMin: 60,
    tenureMonthsMax: 300,
    defaultTenureMonths: 240,
    minAmount: 500000,
    defaultAmount: 5000000,
    compounding: 'monthly',
    isIslamic: false,
    isGovtBacked: false,
    featuredBadge: 'Lowest EMI',
    highlights: [
      'Lowest mortgage rate benchmark in Bangladesh retail banking (12.50%)',
      'Up to 80% financing of property value with tenures up to 25 years',
      'Transparent processing fee (1.0% + VAT) with zero hidden inspection fees',
    ],
    pros: [
      'Lowest monthly EMI payment compared to all other commercial banks',
      'Long tenure reduces monthly cashflow burden significantly',
    ],
    cons: [
      'Prepayment penalty of 1% applies on premature bulk settlements',
      'Documentation vetting is stringent, taking 3-4 weeks for approval',
    ],
    whyConsider:
      'Worth considering if your primary criteria is the absolute lowest monthly EMI payment for an apartment purchase or building construction.',
    taxNote: 'Interest paid on home mortgage is eligible for tax rebate under NBR income tax guidelines.',
    calculatorDefaults: {
      tab: 'emi',
      loanPrincipal: 5000000,
      annualRate: 12.50,
      tenureMonths: 240,
      extraMonthly: 5000,
    },
  },
  {
    id: 'brac-nibash-home-loan',
    bankId: 'brac',
    bankName: 'BRAC Bank PLC',
    bankShort: 'BRAC Bank',
    institutionType: 'private-commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 97,
    schemeName: 'Nibash Home Loan (Fast Prepayment)',
    type: 'loan',
    loanCategory: 'home',
    headlineRate: 12.75,
    rateRangeDisplay: '12.50% - 13.50%',
    rateType: 'Floating / Market',
    tenureDisplay: 'Up to 25 Years',
    tenureMonthsMin: 60,
    tenureMonthsMax: 300,
    defaultTenureMonths: 240,
    minAmount: 500000,
    defaultAmount: 5000000,
    compounding: 'monthly',
    isIslamic: false,
    isGovtBacked: false,
    featuredBadge: 'Editor Pick',
    highlights: [
      '0% prepayment penalty if paid from own verified salary/savings sources',
      'Rapid approval within 10-14 business days with dedicated legal desk',
      'Financing up to ৳2 Crore for apartment purchase, semi-pucca, or construction',
    ],
    pros: [
      'The zero/low prepayment penalty feature allows you to utilize FinLens Prepayment Accelerator to save ৳25+ Lakh and clear the loan 7 years early!',
      'Fastest legal vetting and disbursement process among top banks',
    ],
    cons: [
      'Headline rate is 0.25% higher than DBBL, but saved 10x over if you prepay',
    ],
    whyConsider:
      'The single best home loan for financially savvy borrowers who plan to pay extra monthly or annual lump-sums to become debt-free years ahead of schedule.',
    taxNote: 'Tax rebate available on interest paid under Section 44 of the Income Tax Act.',
    calculatorDefaults: {
      tab: 'emi',
      loanPrincipal: 5000000,
      annualRate: 12.75,
      tenureMonths: 240,
      extraMonthly: 5000,
    },
  },
  {
    id: 'ebl-executive-personal-loan',
    bankId: 'ebl',
    bankName: 'Eastern Bank PLC',
    bankShort: 'Eastern Bank (EBL)',
    institutionType: 'private-commercial',
    creditRating: 'AAA (Highest)',
    safetyScore: 96,
    schemeName: 'EBL Executive Personal Loan',
    type: 'loan',
    loanCategory: 'personal',
    headlineRate: 13.75,
    rateRangeDisplay: '13.50% - 14.50%',
    rateType: 'Floating / Market',
    tenureDisplay: '1 to 5 Years (12 to 60 Months)',
    tenureMonthsMin: 12,
    tenureMonthsMax: 60,
    defaultTenureMonths: 36,
    minAmount: 100000,
    defaultAmount: 500000,
    compounding: 'monthly',
    isIslamic: false,
    isGovtBacked: false,
    featuredBadge: 'Popular',
    highlights: [
      'Unsecured financing up to ৳20 Lakh without any property collateral',
      'Fast turnaround: Approval within 3 to 5 business days for salaried executives',
      'Transparent reducing balance EMI calculation',
    ],
    pros: [
      'Zero collateral needed; relies solely on employment and credit history',
      'No hidden insurance or annual administration fees',
    ],
    cons: [
      'Higher interest rate (13.75%) compared to collateralized home loans',
      'Requires minimum salary of ৳30,000/mo deposited through banking channel',
    ],
    whyConsider:
      'Best for emergency cash needs, medical procedures, home renovation, or wedding expenses when you need fast capital without pledging property.',
    taxNote: 'Personal loan interest is generally not tax-deductible for individuals.',
    calculatorDefaults: {
      tab: 'emi',
      loanPrincipal: 500000,
      annualRate: 13.75,
      tenureMonths: 36,
      extraMonthly: 2000,
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. SMART RECOMMENDATION LOGIC ("Which one is worth considering?")
// ─────────────────────────────────────────────────────────────────────────────

export interface RecommendationCriteria {
  goal: 'fdr' | 'dps' | 'loan' | 'all';
  priority: 'safety' | 'returns' | 'islamic' | 'balanced';
  amount?: number;
  tenureYears?: number;
}

export interface RecommendationResult {
  topPick: BankScheme;
  runnerUp: BankScheme;
  islamicAlternative?: BankScheme;
  summaryTitle: string;
  verdictExplanation: string;
  actionAdvice: string;
  inflationWarning?: string;
}

export function getSmartRecommendation(criteria: RecommendationCriteria): RecommendationResult {
  const { goal, priority } = criteria;

  // Case 1: Loan recommendations
  if (goal === 'loan') {
    if (priority === 'returns' || priority === 'balanced') {
      const top = BANK_SCHEMES.find((s) => s.id === 'brac-nibash-home-loan')!;
      const runner = BANK_SCHEMES.find((s) => s.id === 'dbbl-home-loan')!;
      return {
        topPick: top,
        runnerUp: runner,
        summaryTitle: 'Top Home Mortgage: BRAC Bank Nibash (Zero Prepayment Penalty)',
        verdictExplanation:
          'While DBBL offers a slightly lower headline rate (12.50% vs 12.75%), BRAC Bank allows partial prepayments with zero penalty. FinLens math proves that paying just ৳5,000 extra per month on BRAC Bank saves over ৳25 Lakh in interest and clears the loan 7 years early—far outweighing a 0.25% brochure difference!',
        actionAdvice: 'Always negotiate prepayment terms before signing a mortgage. Flexibility saves more money than a fraction of an interest point.',
      };
    } else {
      const top = BANK_SCHEMES.find((s) => s.id === 'dbbl-home-loan')!;
      const runner = BANK_SCHEMES.find((s) => s.id === 'brac-nibash-home-loan')!;
      return {
        topPick: top,
        runnerUp: runner,
        summaryTitle: 'Lowest EMI Mortgage: Dutch-Bangla Bank (12.50%)',
        verdictExplanation:
          'If your absolute priority is keeping monthly EMI to the bare minimum to qualify within your debt-burden ratio (DBR), DBBL offers the lowest starting rate in the market.',
        actionAdvice: 'Ensure you budget for the 1.0% processing fee and maintain adequate contingency funds.',
      };
    }
  }

  // Case 2: DPS (Monthly recurring savings)
  if (goal === 'dps') {
    if (priority === 'islamic') {
      const top = BANK_SCHEMES.find((s) => s.id === 'shahjalal-dps')!;
      const runner = BANK_SCHEMES.find((s) => s.id === 'brac-future-star-dps')!;
      return {
        topPick: top,
        runnerUp: runner,
        summaryTitle: 'Top Islamic DPS: Shahjalal Islami Bank Mudaraba',
        verdictExplanation:
          'Certified by top Islamic scholars, this scheme offers a highly competitive 10.25% provisional profit rate while deploying your funds strictly in ethical, halal business operations.',
        actionAdvice: 'Set up an automated monthly standing instruction to never miss an installment.',
      };
    }

    if (priority === 'safety') {
      const top = BANK_SCHEMES.find((s) => s.id === 'brac-future-star-dps')!;
      const runner = BANK_SCHEMES.find((s) => s.id === 'city-shreshtho-dps')!;
      return {
        topPick: top,
        runnerUp: runner,
        summaryTitle: 'Top Rated DPS: BRAC Bank Future Star (AAA Safety)',
        verdictExplanation:
          'Committing to a 5 or 10-year monthly deposit requires a bank that will remain rock-solid through any economic cycle. BRAC Bank holds an uncontested AAA rating and the best digital app to track your compounding.',
        actionAdvice: 'A ৳5,000/mo investment over 10 years at 10.25% yields over ৳10.3 Lakh, generating over ৳4.3 Lakh in pure compound interest.',
      };
    }

    // Default DPS: City Bank Shreshtho (Includes free life insurance)
    const top = BANK_SCHEMES.find((s) => s.id === 'city-shreshtho-dps')!;
    const runner = BANK_SCHEMES.find((s) => s.id === 'ebl-millionaire-dps')!;
    const islamic = BANK_SCHEMES.find((s) => s.id === 'shahjalal-dps');
    return {
      topPick: top,
      runnerUp: runner,
      islamicAlternative: islamic,
      summaryTitle: 'Best Value DPS: City Bank Shreshtho (With Free Life Insurance)',
      verdictExplanation:
        'City Bank Shreshtho DPS delivers a generous 10.25% compound return AND provides complimentary life insurance up to ৳10 Lakh. If anything happens to the depositor, the bank pays the remaining balance to the family.',
      actionAdvice: 'An unbeatable package for family providers looking for both growth and family risk protection.',
    };
  }

  // Case 3: FDR / Lump Sum investments
  if (priority === 'islamic') {
    const top = BANK_SCHEMES.find((s) => s.id === 'shahjalal-mtdr')!;
    const runner = BANK_SCHEMES.find((s) => s.id === 'brac-high-yield-fdr')!;
    return {
      topPick: top,
      runnerUp: runner,
      summaryTitle: 'Best Halal Investment: Shahjalal Islami Bank MTDR',
      verdictExplanation:
        'Yields a healthy 10.50% annualized profit rate with verified Shariah governance, backed by one of the most liquid Islamic balance sheets in Bangladesh.',
      actionAdvice: 'Opt for quarterly profit reinvestment to maximize compounding.',
    };
  }

  if (priority === 'safety') {
    const top = BANK_SCHEMES.find((s) => s.id === 'sanchayapatra-5yr')!;
    const runner = BANK_SCHEMES.find((s) => s.id === 'brac-high-yield-fdr')!;
    const islamic = BANK_SCHEMES.find((s) => s.id === 'shahjalal-mtdr');
    return {
      topPick: top,
      runnerUp: runner,
      islamicAlternative: islamic,
      summaryTitle: 'Undisputed Capital Safety: 5-Year Bangladesh Sanchayapatra',
      verdictExplanation:
        'At 11.52% with a 100% sovereign guarantee from the Bangladesh government, Sanchayapatra is mathematically unbeatable for safety. Commercial banks cannot legally match sovereign zero-default credit status.',
      actionAdvice: 'If you have not reached the ৳30-50 Lakh individual limit, max out your Sanchayapatra quota first before investing in commercial bank FDRs.',
      inflationWarning: 'With national inflation near 9.5%, this 11.52% rate is one of the few guaranteed instruments that creates real positive purchasing power!',
    };
  }

  if (priority === 'returns') {
    const top = BANK_SCHEMES.find((s) => s.id === 'idlc-term-deposit')!;
    const runner = BANK_SCHEMES.find((s) => s.id === 'sanchayapatra-5yr')!;
    const islamic = BANK_SCHEMES.find((s) => s.id === 'shahjalal-mtdr');
    return {
      topPick: top,
      runnerUp: runner,
      islamicAlternative: islamic,
      summaryTitle: 'Highest Corporate Yield: IDLC Finance Term Deposit (11.50%)',
      verdictExplanation:
        'IDLC offers 11.50%—surpassing commercial banks by 0.75-1.00%—while maintaining an AAA corporate credit rating and 35+ years of zero-default history.',
      actionAdvice: 'Select quarterly compounding over monthly withdrawal to earn a higher effective annual percentage yield (APY).',
    };
  }

  // Default / Balanced: BRAC Bank High-Yield FDR
  const top = BANK_SCHEMES.find((s) => s.id === 'brac-high-yield-fdr')!;
  const runner = BANK_SCHEMES.find((s) => s.id === 'sanchayapatra-5yr')!;
  const islamic = BANK_SCHEMES.find((s) => s.id === 'shahjalal-mtdr');
  return {
    topPick: top,
    runnerUp: runner,
    islamicAlternative: islamic,
    summaryTitle: 'Best Balanced FDR: BRAC Bank High-Yield (10.75%)',
    verdictExplanation:
      'The optimal sweet spot of high yield (10.75%), AAA balance sheet security, and instant liquidity via the Astha app with 90% instant overdraft loans.',
    actionAdvice: 'Submit your Proof of Tax Return (PSR) to ensure your bank applies 10% AIT instead of the punishing 15% non-filing rate.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FINANCIAL ADVISORY PILLARS ("Which one is worth considering?")
// ─────────────────────────────────────────────────────────────────────────────

export interface AdvisoryPillar {
  id: string;
  title: string;
  badge: string;
  summary: string;
  keyRule: string;
  detailedPoints: string[];
}

export const ADVISORY_PILLARS: AdvisoryPillar[] = [
  {
    id: 'safety-vs-yield',
    title: 'Safety vs. Chasing Rates: The Credit Rating Rule',
    badge: 'Institutional Safety',
    summary:
      'Never risk your principal for an extra 0.5% or 1.0% interest rate at a troubled financial institution.',
    keyRule: 'Rule: Put safety first. An AAA-rated bank at 10.5% is infinitely superior to a distressed bank at 12.0%.',
    detailedPoints: [
      'Bangladesh Bank Deposit Insurance covers up to ৳2,00,000 per depositor. Anything above that is exposed to the bank balance sheet risk.',
      'Tier-1 banks (BRAC, EBL, City, DBBL) and AAA NBFIs (IDLC) hold solid liquidity ratios and low non-performing loans (NPLs).',
      'If you have large capital (৳50L+), diversify across 2 or 3 AAA-rated institutions or Government Sanchayapatra.',
    ],
  },
  {
    id: 'inflation-hurdle',
    title: 'The Inflation Hurdle: Beating 9.5% Erosion',
    badge: 'Purchasing Power',
    summary:
      'Brochure interest rates are nominal. When inflation is 9.5% and source tax is 10%, an 8.5% FDR actually LOSES money in real terms!',
    keyRule: 'Rule: You need an effective rate of at least 10.55% just to preserve your real purchasing power after tax.',
    detailedPoints: [
      'Example: ৳10 Lakh at 9.0% generates ৳90,000 gross. Minus 10% tax = ৳81,000 net. But 9.5% inflation eroded ৳95,000 of goods! Real loss: -৳14,000.',
      'Sanchayapatra (11.52%) and High-Yield FDRs (10.75% - 11.50%) are among the only guaranteed fixed-income assets beating inflation right now.',
      'For long horizons (5-10 yrs), a Step-Up DPS or compounding FDR is essential to outpace inflation.',
    ],
  },
  {
    id: 'tax-optimization',
    title: 'Tax Arbitrage: Save 5% Instantly via TIN/PSR',
    badge: 'Tax Optimization',
    summary:
      'Submitting your Proof of Submission of Return (PSR) legally drops your Source Tax (AIT) from 15% to 10%.',
    keyRule: 'Rule: Always submit your annual PSR receipt to your bank branch or mobile app before June 30 / December 31.',
    detailedPoints: [
      'On a ৳10 Lakh deposit earning 11% (৳1,10,000 profit): 15% tax = ৳16,500 deduction vs 10% tax = ৳11,000 deduction.',
      'Submitting one simple PDF receipt saves you ৳5,500 in pure cash every single year on a single FDR!',
      'Excise Duty Tip: Bangladesh Bank charges ৳3,000 when your peak balance touches ৳10 Lakh, and ৳5,000 when it touches ৳50 Lakh. Keeping two accounts of ৳4.9 Lakh instead of one of ৳9.8 Lakh saves ৳3,000 annually!',
    ],
  },
  {
    id: 'loan-prepayment-power',
    title: 'Loan Prepayment: Why Terms Beat Rates',
    badge: 'Debt Freedom',
    summary:
      'Do not choose a bank based solely on a 0.25% lower interest rate if they hit you with early settlement penalties.',
    keyRule: 'Rule: A 12.75% home loan with 0% prepayment penalty is vastly cheaper than a 12.50% loan with a 1.5% penalty.',
    detailedPoints: [
      'Mortgage interest is heavily front-loaded in the first 7 years. Extra payments directly slash principal debt.',
      'In FinLens, adding just ৳5,000/month on a ৳50 Lakh loan at 12.75% shaves 7.2 years off a 20-year tenure and saves over ৳26 Lakh in interest!',
      'Ensure your loan agreement explicitly allows partial lumpsum prepayments without extra penalty charges.',
    ],
  },
];
