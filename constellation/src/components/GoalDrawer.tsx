import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { goals } from '../data/goals';
import { useStore } from '../store';
import { ChartViz } from './MiniChart';

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  current,
  target,
  baseline,
  baselineLabel,
  currentLabel,
  targetLabel,
  color,
}: {
  current: number;
  target: number;
  baseline?: number;
  baselineLabel?: string;
  currentLabel: string;
  targetLabel: string;
  color: string;
}) {
  const pct = (v: number) => Math.min((v / target) * 100, 100);

  return (
    <div className="mb-5">
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <span className="text-2xl font-bold text-white">{current}%</span>
          <span className="text-xs text-slate-500 ml-2">{currentLabel}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold" style={{ color }}>Goal: {target}%</span>
          <div className="text-xs text-slate-500">{targetLabel}</div>
        </div>
      </div>
      <div className="relative h-3 bg-white/8 rounded-full overflow-hidden">
        {baseline !== undefined && (
          <div
            className="absolute top-0 h-full bg-white/10 rounded-full"
            style={{ width: `${pct(baseline)}%` }}
          />
        )}
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct(current)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
        {/* Goal marker */}
        <div className="absolute top-0 right-0 h-full w-px bg-white/30" />
      </div>
      <div className="flex justify-between mt-1">
        {baseline !== undefined && (
          <span className="text-xs text-slate-600">{baselineLabel}: {baseline}%</span>
        )}
        <span className="text-xs text-slate-600 ml-auto">Target: {target}%</span>
      </div>
    </div>
  );
}

// ─── Practice level badge ─────────────────────────────────────────────────────

const LEVEL_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  system:   { bg: 'bg-violet-500/15', text: 'text-violet-400', label: 'System' },
  school:   { bg: 'bg-blue-500/15',   text: 'text-blue-400',   label: 'School' },
  educator: { bg: 'bg-green-500/15',  text: 'text-green-400',  label: 'Educator' },
};

// ─── Main drawer ──────────────────────────────────────────────────────────────

export function GoalDrawer() {
  const { selectedGoalId, selectGoal } = useStore();
  const goal = goals.find((g) => g.id === selectedGoalId) ?? null;

  return (
    <AnimatePresence>
      {goal && (
        <motion.aside
          key={goal.id}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md glass-panel-dark border-l border-white/6 flex flex-col z-30"
          style={{ boxShadow: `-24px 0 64px rgba(0,0,0,0.6)` }}
        >
          {/* Header */}
          <div
            className="flex items-start justify-between px-5 pt-5 pb-4 flex-shrink-0"
            style={{ borderBottom: `1px solid ${goal.nodeColor}22` }}
          >
            <div className="flex items-start gap-3 pr-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
                style={{ background: `${goal.nodeColor}22`, border: `1px solid ${goal.nodeColor}44` }}
              >
                {goal.emoji}
              </div>
              <div>
                <div
                  className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                  style={{ color: goal.areaColor }}
                >
                  {goal.areaLabel}
                </div>
                <h2 className="text-base font-bold text-white leading-snug">{goal.title}</h2>
              </div>
            </div>
            <button
              onClick={() => selectGoal(null)}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto drawer-scroll px-5 py-4 space-y-6">
            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed">{goal.description}</p>

            {/* Callout */}
            {goal.callout && (
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-4"
                style={{ background: `${goal.nodeColor}15`, border: `1px solid ${goal.nodeColor}30` }}
              >
                <div className="text-2xl font-extrabold" style={{ color: goal.nodeColor }}>
                  {goal.callout.value}
                </div>
                <div className="text-xs text-slate-400 leading-snug">{goal.callout.label}</div>
              </div>
            )}

            {/* Progress */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Progress</p>
              <ProgressBar
                current={goal.currentPct}
                target={goal.targetPct}
                baseline={goal.baselinePct}
                baselineLabel={goal.baselineLabel}
                currentLabel={goal.currentLabel}
                targetLabel={goal.targetLabel}
                color={goal.nodeColor}
              />
              <p className="text-xs text-slate-600">{goal.progressUnit}</p>
            </div>

            {/* Charts */}
            {goal.charts.length > 0 && (
              <div className="space-y-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</p>
                {goal.charts.map((chart, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <ChartViz chart={chart} />
                  </div>
                ))}
              </div>
            )}

            {/* Practices */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Key Practices
              </p>
              <div className="space-y-2.5">
                {goal.practices.map((p, i) => {
                  const style = LEVEL_STYLE[p.level];
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      <p className="text-sm text-slate-300 leading-snug">{p.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spacer */}
            <div className="h-4" />
          </div>

          {/* Footer nav */}
          <div className="flex-shrink-0 px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => {
                const idx = goals.findIndex((g) => g.id === goal.id);
                const prev = goals[(idx - 1 + goals.length) % goals.length];
                selectGoal(prev.id);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              ← Prev Goal
            </button>
            <span className="text-xs text-slate-600">
              {goals.findIndex((g) => g.id === goal.id) + 1} / {goals.length}
            </span>
            <button
              onClick={() => {
                const idx = goals.findIndex((g) => g.id === goal.id);
                const next = goals[(idx + 1) % goals.length];
                selectGoal(next.id);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Next Goal →
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
