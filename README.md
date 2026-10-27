# 🔍 FinLens

> **See beyond gross bank rates.** Compare FDR, DPS, and Loan EMI scenarios side-by-side through interactive visual charts.

**FinLens** is a 100% client-side, privacy-first financial calculation and scenario comparison web app hosted as a static site on GitHub Pages. Instead of isolated calculators that only show brochure numbers, FinLens lets you visually pit savings schemes and loan repayment strategies against each other—factoring in real-world deductions like source tax, excise duties, and inflation.

---

## ✨ Key Highlights

- **Arbitrary Precision Math (`decimal.js`):** Pure, framework-agnostic calculation engine with zero IEEE-754 floating-point inaccuracies. 98 Vitest unit tests verifying edge cases.
- **Zero-"Calculate"-Button UX:** Real-time 60fps reactivity across dual controls (draggable sliders + direct numeric inputs).
- **Reality Toggles:** Factor in Source Tax / AIT (%), annual bank excise duties/fees, and inflation discounting to uncover your true future purchasing power.
- **Side-by-Side Scenario Arena:** Pin up to 3 financial schemes (e.g. Bank A vs. Bank B FDR, or Loan Prepayment vs. DPS Investment) onto unified multi-series growth charts with automated **Winner Badges**.
- **Prepayment Accelerator:** Calculate exact interest savings and tenure shaved off through extra monthly or annual lump-sum prepayments.
- **Privacy-First & Serverless:** 100% in-browser execution with client-side CSV table exports, PDF report generation, and URL query-string state sharing.
- **Currency & Notation Agnostic:** Presets for BDT (`৳`), INR (`₹`), USD (`$`), EUR (`€`), and GBP (`£`) with South Asian (Lakh/Crore) and International (K/M) notation toggles.

---

## 🏗️ Architecture & Project Structure

```
FinLens/
├── .github/workflows/
│   └── deploy.yml              # Automated GitHub Pages CI/CD workflow
├── src/
│   ├── engine/                 # Pure TypeScript + decimal.js math engine
│   │   ├── adjustments.ts      # Tax, fees, inflation, currency formatting
│   │   ├── adjustments.test.ts # 16 tests
│   │   ├── fdr.ts              # Fixed Deposit compounding engine
│   │   ├── fdr.test.ts         # 26 tests
│   │   ├── dps.ts              # Recurring Deposit engine & inflection analysis
│   │   ├── dps.test.ts         # 23 tests
│   │   ├── emi.ts              # Loan Amortization & Prepayment optimizer
│   │   ├── emi.test.ts         # 27 tests
│   │   ├── comparison.ts       # Unified multi-series timeline & winner logic
│   │   ├── comparison.test.ts  # 3 tests
│   │   └── types.ts            # Domain interfaces
│   ├── state/
│   │   ├── settings.tsx        # Currency, number notation, and dark/light mode
│   │   ├── scenarios.tsx       # Arena comparison state & battle presets
│   │   ├── urlState.ts         # URL query-string serializer for 1-click sharing
│   │   └── urlState.test.ts    # 3 tests
│   ├── components/
│   │   ├── charts/             # GrowthCurveChart, BreakdownDonut, AmortizationChart, OverlaidGrowthChart
│   │   ├── controls/           # DualSliderInput, RealityToggles, KpiCard
│   │   ├── navigation/         # Navbar, ArenaTray
│   │   ├── tables/             # Expandable ScheduleTable with CSV export
│   │   └── ui/                 # Radix UI primitives
│   ├── features/
│   │   ├── single/             # FdrCalculator, DpsCalculator, EmiCalculator, SingleCalculatorView
│   │   └── arena/              # ScenarioArenaView, ScenarioCard
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/Tonmoy-saha18/FinLens.git
cd FinLens

# Install dependencies
npm install
```

### Development
```bash
# Start Vite development server
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### Running Unit Tests
```bash
# Run all 98 Vitest precision tests
npm test
```

### Production Build
```bash
# Typecheck and build for GitHub Pages
npm run build
```

---

## 🚢 Continuous Deployment (GitHub Pages)

The repository includes [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) configured with:
1. Automated checkout and Node.js setup
2. Strict unit testing via `npm test` before building
3. Production compilation with `base: '/finlense/'`
4. Automated deployment to GitHub Pages on every push to `main`

---

## 📄 License
MIT License. Built for precision financial planning.