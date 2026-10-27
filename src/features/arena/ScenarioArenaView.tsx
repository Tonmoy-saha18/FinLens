import { useState, useMemo } from 'react';
import {
  Swords,
  Trophy,
  Sparkles,
  TrendingUp,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { useScenarios } from '@/state/scenarios';
import { useSettings } from '@/state/settings';
import { ScenarioCard } from './ScenarioCard';
import { OverlaidGrowthChart } from '@/components/charts/OverlaidGrowthChart';
import { alignScenariosTimeline, determineWinner } from '@/engine/comparison';
import { Button } from '@/components/ui/button';

export function ScenarioArenaView() {
  const {
    pinnedScenarios,
    unpinScenario,
    updateScenarioName,
    clearAllScenarios,
    loadPresetBattle,
    setActiveView,
  } = useScenarios();

  const { formatMoney, formatShort } = useSettings();
  const [useRealValue, setUseRealValue] = useState(false);

  // Winner evaluation
  const winnerInfo = useMemo(() => {
    return determineWinner(pinnedScenarios);
  }, [pinnedScenarios]);

  // Unified timeline for multi-series chart
  const timelineData = useMemo(() => {
    return alignScenariosTimeline(pinnedScenarios, useRealValue);
  }, [pinnedScenarios, useRealValue]);

  return (
    <div className="space-y-6">
      {/* Arena Header & Battle Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <span>The Scenario Arena</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {pinnedScenarios.length}/3 Pinned
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Battle-test up to 3 financial schemes side-by-side with overlaid trajectory curves.
          </p>
        </div>

        {/* Quick Battle Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Battles:
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPresetBattle('fdr-war')}
            className="h-7 text-xs rounded-full px-3 font-medium bg-card/60 hover:bg-primary/10 hover:text-primary transition-all"
          >
            FDR Rate War
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPresetBattle('loan-prepay')}
            className="h-7 text-xs rounded-full px-3 font-medium bg-card/60 hover:bg-primary/10 hover:text-primary transition-all"
          >
            Loan Prepay vs Base
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPresetBattle('dps-tenure')}
            className="h-7 text-xs rounded-full px-3 font-medium bg-card/60 hover:bg-primary/10 hover:text-primary transition-all"
          >
            DPS Tenure Battle
          </Button>

          {pinnedScenarios.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllScenarios}
              className="h-7 text-xs text-muted-foreground hover:text-destructive px-2"
              title="Clear all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {pinnedScenarios.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border/80 p-12 text-center space-y-4 bg-muted/10">
          <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary">
            <Swords className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-foreground">No Scenarios Pinned Yet</h3>
            <p className="text-xs text-muted-foreground">
              Go to any calculator (FDR, DPS, or EMI) and click &quot;+ Pin to Arena&quot;, or launch one of our curated financial battles above.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              onClick={() => loadPresetBattle('fdr-war')}
              className="gap-2 text-xs h-9 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load FDR Rate War
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveView('single')}
              className="gap-2 text-xs h-9 font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5 text-primary" />
              Go to Calculators
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Winner Insight Banner */}
          {winnerInfo.winnerId && pinnedScenarios.length > 1 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-teal-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Winner:{' '}
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {pinnedScenarios.find((s) => s.id === winnerInfo.winnerId)?.name}
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground">{winnerInfo.reason}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveView('single')}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <PlusCircle className="h-3.5 w-3.5 text-primary" />
                  <span>Pin Another Scenario</span>
                </Button>
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Cards Grid (up to 3 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pinnedScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isWinner={scenario.id === winnerInfo.winnerId}
                winnerBadge={winnerInfo.badgeLabel}
                onRemove={unpinScenario}
                onRename={updateScenarioName}
              />
            ))}

            {pinnedScenarios.length < 3 && (
              <div
                onClick={() => setActiveView('single')}
                className="rounded-2xl border-2 border-dashed border-border/80 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all min-h-[280px] group"
              >
                <div className="p-3 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all mb-3">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Add Scenario #{pinnedScenarios.length + 1}</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Switch to the calculators and pin another scheme to compare.
                </p>
              </div>
            )}
          </div>

          {/* Unified Overlaid Growth Trajectory Chart */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Unified Trajectory Comparison
                </h4>
                <p className="text-xs text-muted-foreground">
                  Synchronized multi-series curve tracking all pinned scenarios over time
                </p>
              </div>

              {/* Toggle Real vs Nominal */}
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/60 text-xs">
                <button
                  onClick={() => setUseRealValue(false)}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    !useRealValue
                      ? 'bg-background text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Nominal Value
                </button>
                <button
                  onClick={() => setUseRealValue(true)}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    useRealValue
                      ? 'bg-background text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Inflation Discounted
                </button>
              </div>
            </div>

            <OverlaidGrowthChart
              data={timelineData}
              scenarios={pinnedScenarios}
              formatValue={(v) => formatMoney(v)}
              formatYAxis={(v) => formatShort(v)}
            />
          </div>
        </>
      )}
    </div>
  );
}
