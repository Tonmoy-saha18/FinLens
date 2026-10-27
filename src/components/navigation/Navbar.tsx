import { Sun, Moon, ShieldCheck, Sparkles, TrendingUp, Swords, Calculator, Share2, Printer } from 'lucide-react';
import { useSettings } from '@/state/settings';
import { useScenarios } from '@/state/scenarios';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const {
    currencyCode,
    setCurrencyCode,
    numberSystem,
    setNumberSystem,
    isDark,
    toggleTheme,
    symbol,
  } = useSettings();

  const { activeView, setActiveView, pinnedScenarios } = useScenarios();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveView('single')}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-chart-5 text-primary-foreground shadow-md shadow-primary/20 cursor-pointer"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('single')}>
              <span className="text-xl font-extrabold tracking-tight font-sans">
                Fin<span className="gradient-text">Lens</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                <Sparkles className="w-2.5 h-2.5" />
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden lg:flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              100% Client-Side Financial Precision Engine
            </p>
          </div>
        </div>

        {/* View Switcher: Single vs Arena */}
        <div className="flex items-center bg-muted/70 p-1 rounded-xl border border-border/60 text-xs font-semibold">
          <button
            onClick={() => setActiveView('single')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'single'
                ? 'bg-background text-foreground shadow-sm font-bold text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calculators</span>
          </button>

          <button
            onClick={() => setActiveView('arena')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'arena'
                ? 'bg-background text-foreground shadow-sm font-bold text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Scenario Arena</span>
            {pinnedScenarios.length > 0 && (
              <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground font-mono">
                {pinnedScenarios.length}
              </span>
            )}
          </button>
        </div>

        {/* Controls: Currency, Numbering, Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Selector */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60">
            <span className="text-xs font-mono font-bold text-muted-foreground px-2">
              {symbol}
            </span>
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="text-xs font-semibold bg-transparent border-0 text-foreground pr-2 py-0.5 focus:outline-none cursor-pointer"
              aria-label="Currency selector"
            >
              <option value="BDT" className="bg-background text-foreground">BDT (৳)</option>
              <option value="INR" className="bg-background text-foreground">INR (₹)</option>
              <option value="USD" className="bg-background text-foreground">USD ($)</option>
              <option value="EUR" className="bg-background text-foreground">EUR (€)</option>
              <option value="GBP" className="bg-background text-foreground">GBP (£)</option>
            </select>
          </div>

          {/* Number System Toggle (Lakh/Crore vs K/M) */}
          <div className="hidden md:flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs">
            <button
              onClick={() => setNumberSystem('south-asian')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                numberSystem === 'south-asian'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Lakh / Cr
            </button>
            <button
              onClick={() => setNumberSystem('international')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                numberSystem === 'international'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              K / M
            </button>
          </div>

          {/* Action: Share Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const url = window.location.href;
              if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                alert('FinLens shareable link copied to clipboard!');
              }
            }}
            className="h-8 gap-1.5 text-xs font-semibold rounded-lg hidden sm:flex text-muted-foreground hover:text-foreground"
            title="Share financial plan"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span>Share</span>
          </Button>

          {/* Action: Print / PDF Report */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.print()}
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hidden sm:flex"
            title="Print / Save PDF Report"
            aria-label="Print report"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
