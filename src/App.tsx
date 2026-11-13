import { Navbar } from '@/components/navigation/Navbar';
import { ArenaTray } from '@/components/navigation/ArenaTray';
import { SingleCalculatorView } from '@/features/single/SingleCalculatorView';
import { ScenarioArenaView } from '@/features/arena/ScenarioArenaView';
import { BankAdvisorView } from '@/features/advisor/BankAdvisorView';
import { SettingsProvider } from '@/state/settings';
import { ScenariosProvider, useScenarios } from '@/state/scenarios';
import { ShieldCheck, Cpu, Eye, Lock } from 'lucide-react';

function AppContent() {
  const { activeView } = useScenarios();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Contextual Hero Section */}
      <section className="border-b border-border/40 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              {activeView === 'single' && (
                <>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    Precision Financial <span className="gradient-text">Calculators</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                    Interactive FDR, DPS, and Loan calculators with Source Tax, excise duties, and inflation adjustments.
                  </p>
                </>
              )}
              {activeView === 'advisor' && (
                <>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    Bank Rates & <span className="gradient-text">Investment Advisor</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                    Current interest rates across Bangladesh banks & Sanchayapatra with data-driven advice on what is worth considering.
                  </p>
                </>
              )}
              {activeView === 'arena' && (
                <>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    Scenario Comparison <span className="gradient-text">Arena</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                    Pin up to 3 financial plans side-by-side on unified charts with automated winner analysis.
                  </p>
                </>
              )}
            </div>

            {/* Security & Feature Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border/60 shadow-sm text-muted-foreground font-medium text-[11px]">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>100% In-Browser Privacy</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border/60 shadow-sm text-muted-foreground font-medium text-[11px]">
                <Cpu className="w-3 h-3 text-indigo-500" />
                <span>Bank-Grade Math</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border/60 shadow-sm text-muted-foreground font-medium text-[11px]">
                <Eye className="w-3 h-3 text-amber-500" />
                <span>Inflation-Adjusted</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeView === 'single' && <SingleCalculatorView />}
        {activeView === 'arena' && <ScenarioArenaView />}
        {activeView === 'advisor' && <BankAdvisorView />}
      </main>

      {/* Floating Arena Launcher */}
      <ArenaTray />

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/20 py-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>FinLens operates 100% in your browser. Zero tracking. Zero remote calculation.</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground/80 font-mono text-[11px]">
            <span>FinLens • Intelligent Financial Decision Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <ScenariosProvider>
        <AppContent />
      </ScenariosProvider>
    </SettingsProvider>
  );
}

export default App;
