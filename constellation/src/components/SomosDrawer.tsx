import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { TOA_LAYERS, MISSION, STUDENT_IDENTITY } from '../data/toa';

// ─── Strategic area summary ────────────────────────────────────────────────────

const AREAS = [
  {
    key: 'belonging',
    label: 'Belonging',
    color: '#f59e0b',
    goals: 1,
    description: 'Every student feels seen, valued, and connected to the school community.',
  },
  {
    key: 'foundations',
    label: 'Foundations',
    color: '#06b6d4',
    goals: 2,
    description: 'Early literacy and math skills that unlock access to all future learning.',
  },
  {
    key: 'mastery',
    label: 'Mastery',
    color: '#3b82f6',
    goals: 3,
    description: 'Grade-level proficiency in reading, writing, and mathematics for every student.',
  },
  {
    key: 'future',
    label: 'Future Ready',
    color: '#8b5cf6',
    goals: 1,
    description: 'Pathways to graduation, higher education, and career readiness.',
  },
];

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl py-3 px-2 text-center"
      style={{ background: `${color}12`, border: `1px solid ${color}28` }}
    >
      <span className="text-xl font-extrabold" style={{ color }}>{value}</span>
      <span className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</span>
    </div>
  );
}

// ─── Main drawer ───────────────────────────────────────────────────────────────

export function SomosDrawer() {
  const { somosOpen, closeSomos } = useStore();

  return (
    <AnimatePresence>
      {somosOpen && (
        <motion.aside
          key="somos-drawer"
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
            style={{ borderBottom: '1px solid rgba(0,133,68,0.2)' }}
          >
            <div className="flex items-start gap-3 pr-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(0,133,68,0.15)', border: '1px solid rgba(0,133,68,0.35)' }}
              >
                🌟
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#00d97a' }}>
                  District Overview
                </div>
                <h2 className="text-base font-bold text-white leading-snug">Somos Mount Vernon</h2>
                <p className="text-xs text-slate-500 mt-0.5">{STUDENT_IDENTITY.join(' · ')}</p>
              </div>
            </div>
            <button
              onClick={closeSomos}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto drawer-scroll px-5 py-4 space-y-6">

            {/* Mission */}
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: 'rgba(0,133,68,0.08)', border: '1px solid rgba(0,133,68,0.2)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1.5">Mission</p>
              <p className="text-sm text-slate-200 leading-relaxed italic">"{MISSION}"</p>
            </div>

            {/* At-a-glance stats */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">At a Glance</p>
              <div className="grid grid-cols-3 gap-2">
                <StatTile value="6,441" label="Students" color="#008544" />
                <StatTile value="4"     label="Strategic Areas" color="#06b6d4" />
                <StatTile value="7"     label="Goals" color="#3b82f6" />
                <StatTile value="2031"  label="Target Horizon" color="#8b5cf6" />
                <StatTile value="57%"   label="Hispanic / Latino" color="#f59e0b" />
                <StatTile value="90%"   label="Graduation Goal" color="#008544" />
              </div>
            </div>

            {/* Strategic areas */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Strategic Areas</p>
              <div className="space-y-2.5">
                {AREAS.map((area) => (
                  <div
                    key={area.key}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: `${area.color}0d`, border: `1px solid ${area.color}22` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: area.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold" style={{ color: area.color }}>{area.label}</span>
                        <span className="text-xs text-slate-600">{area.goals} goal{area.goals !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">{area.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Theory of Action */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Theory of Action</p>
              <div className="space-y-2">
                {TOA_LAYERS.map((layer) => (
                  <div key={layer.key} className="flex items-start gap-2.5">
                    <div
                      className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 whitespace-nowrap"
                      style={{
                        background: `${layer.color}18`,
                        color: layer.color,
                        border: `1px solid ${layer.color}30`,
                      }}
                    >
                      {layer.shortLabel}
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{layer.when}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-4" />
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-3 border-t border-white/5 flex items-center justify-center">
            <p className="text-xs text-slate-600 text-center">
              Click any goal node to explore metrics and practices
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
