import { Swords, ArrowRight } from 'lucide-react';
import { useScenarios } from '@/state/scenarios';
import { Button } from '@/components/ui/button';

export function ArenaTray() {
  const { pinnedScenarios, activeView, setActiveView, notification } = useScenarios();

  return (
    <>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2 border border-border">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      {/* Floating Arena Tray */}
      {activeView === 'single' && pinnedScenarios.length > 0 && (
        <div className="fixed bottom-5 right-5 z-40 animate-slide-in">
          <div className="glass-card rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-2xl border border-primary/40 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                <Swords className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xs font-bold block text-foreground">
                  Scenario Arena
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    {pinnedScenarios.length}/3 Pinned:
                  </span>
                  <div className="flex items-center gap-1">
                    {pinnedScenarios.map((s) => (
                      <span
                        key={s.id}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                        title={s.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setActiveView('arena')}
              className="h-8 gap-1.5 text-xs font-bold rounded-xl shadow-sm"
            >
              <span>Compare Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
