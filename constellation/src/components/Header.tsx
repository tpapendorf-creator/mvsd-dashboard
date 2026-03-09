import React from 'react';
import { useStore } from '../store';

export function Header() {
  const { presentationMode, toaVisible, togglePresentation, toggleToa } = useStore();

  return (
    <header className="flex items-center justify-between px-6 py-3 glass-panel border-b border-white/5 z-20 flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-mvsd-green flex items-center justify-center text-white font-bold text-sm">
            MV
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight tracking-wide">
              MVSD Strategic Constellation
            </div>
            <div className="text-xs text-slate-500 leading-tight">
              Mount Vernon School District · 2024–2031
            </div>
          </div>
        </div>
      </div>

      {/* Goal area legend */}
      <div className="hidden md:flex items-center gap-5">
        {[
          { color: '#7c3aed', label: 'Community of Belonging' },
          { color: '#008544', label: 'Strong Foundations' },
          { color: '#2563eb', label: 'Grade Level Mastery' },
          { color: '#d97706', label: 'Navigating Future' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleToa}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-all border ${
            toaVisible
              ? 'bg-mvsd-green/20 border-mvsd-green/40 text-green-400'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          Theory of Action
        </button>
        <button
          onClick={togglePresentation}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-all border ${
            presentationMode
              ? 'bg-white text-space-950 border-white'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
          }`}
        >
          {presentationMode ? '✕ Exit Presentation' : '⛶ Present'}
        </button>
      </div>
    </header>
  );
}
