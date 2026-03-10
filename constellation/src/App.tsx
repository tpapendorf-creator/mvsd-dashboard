import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { ConstellationCanvas } from './components/ConstellationCanvas';
import { GoalDrawer } from './components/GoalDrawer';
import { SomosDrawer } from './components/SomosDrawer';
import { useStore } from './store';
import { goals } from './data/goals';
import { MISSION } from './data/toa';

// ─── Presentation mode overlay banner ────────────────────────────────────────

function PresentationBanner() {
  const { selectedGoalId } = useStore();
  const goal = goals.find((g) => g.id === selectedGoalId);

  return (
    <AnimatePresence>
      {goal && (
        <motion.div
          key={goal.id}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ width: 'min(600px, 90vw)' }}
        >
          <div
            className="rounded-2xl px-6 py-4 glass-panel text-center"
            style={{ borderColor: `${goal.nodeColor}40` }}
          >
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: goal.areaColor }}>
              {goal.areaLabel}
            </div>
            <div className="text-lg font-bold text-white mb-1">{goal.title}</div>
            <div className="flex items-center justify-center gap-6">
              <div>
                <span className="text-2xl font-extrabold" style={{ color: goal.nodeColor }}>{goal.currentPct}%</span>
                <span className="text-xs text-slate-400 ml-1">{goal.currentLabel}</span>
              </div>
              <div className="text-slate-600">→</div>
              <div>
                <span className="text-xl font-bold text-slate-300">{goal.targetPct}%</span>
                <span className="text-xs text-slate-500 ml-1">Goal by 2031</span>
              </div>
            </div>
            {goal.callout && (
              <div className="mt-2 text-xs text-slate-400">
                <span className="font-semibold text-white">{goal.callout.value}</span> · {goal.callout.label}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Help hint ────────────────────────────────────────────────────────────────

function HelpHint() {
  const { selectedGoalId, somosOpen } = useStore();
  if (selectedGoalId || somosOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10"
    >
      <p className="text-xs text-slate-600 text-center">
        Click a goal node to explore · Hover to highlight connections
      </p>
    </motion.div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const { presentationMode, selectedGoalId, selectGoal, togglePresentation, closeSomos } = useStore();

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectGoal(null);
        closeSomos();
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const idx = selectedGoalId ? goals.findIndex((g) => g.id === selectedGoalId) : -1;
        selectGoal(goals[(idx + 1) % goals.length].id);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const idx = selectedGoalId ? goals.findIndex((g) => g.id === selectedGoalId) : goals.length;
        selectGoal(goals[(idx - 1 + goals.length) % goals.length].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedGoalId, selectGoal, closeSomos]);

  return (
    <div className="flex flex-col h-full bg-space-950 overflow-hidden">
      {/* Header hidden in presentation mode */}
      <AnimatePresence>
        {!presentationMode && (
          <motion.div
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0"
          >
            <Header />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main canvas area */}
      <div className="flex-1 relative min-h-0">
        <ConstellationCanvas />

        {/* Drawers — normal mode only */}
        {!presentationMode && <GoalDrawer />}
        {!presentationMode && <SomosDrawer />}

        {/* Presentation mode banner */}
        {presentationMode && <PresentationBanner />}

        {/* Presentation mode exit button */}
        {presentationMode && (
          <button
            onClick={togglePresentation}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded text-xs font-medium bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
          >
            ✕ Exit
          </button>
        )}

        {/* Mission tagline in presentation mode */}
        {presentationMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-mvsd-green flex items-center justify-center text-white font-bold text-xs">MV</div>
              <span className="text-sm font-semibold text-white">MVSD Strategic Constellation</span>
            </div>
          </div>
        )}

        {!presentationMode && <HelpHint />}
      </div>
    </div>
  );
}
