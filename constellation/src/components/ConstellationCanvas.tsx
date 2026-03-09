import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { goals, EDGES } from '../data/goals';
import { TOA_LAYERS, MISSION, STUDENT_IDENTITY } from '../data/toa';
import { useStore } from '../store';

// ─── Seeded pseudo-random (LCG) ───────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff);
  };
}

// ─── Star field ───────────────────────────────────────────────────────────────

function StarField() {
  const stars = useMemo(() => {
    const rng = seededRng(42);
    return Array.from({ length: 160 }, (_, i) => ({
      id: i,
      cx: rng() * 1000,
      cy: rng() * 680,
      r: rng() * 1.4 + 0.4,
      opacity: rng() * 0.6 + 0.15,
      duration: rng() * 4 + 2,
      delay: rng() * 5,
    }));
  }, []);

  return (
    <g>
      {stars.map((s) => (
        <circle
          key={s.id}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="white"
          className="star-twinkle"
          style={
            {
              '--duration': `${s.duration}s`,
              '--delay': `${s.delay}s`,
              '--min-opacity': s.opacity * 0.3,
              '--max-opacity': s.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </g>
  );
}

// ─── Theory of Action rings ───────────────────────────────────────────────────

function ToaRings() {
  const cx = 500, cy = 340;
  return (
    <g>
      {[...TOA_LAYERS].reverse().map((layer) => (
        <g key={layer.key}>
          <circle
            cx={cx} cy={cy} r={layer.radius}
            fill={layer.color}
            fillOpacity={layer.opacity}
            stroke={layer.color}
            strokeOpacity={0.25}
            strokeWidth={1}
            className="toa-ring-pulse"
          />
        </g>
      ))}
      {/* Ring labels on the right edge of each ring */}
      {TOA_LAYERS.map((layer) => (
        <text
          key={`lbl-${layer.key}`}
          x={cx + layer.radius + 6}
          y={cy - 4}
          fill={layer.color}
          fillOpacity={0.55}
          fontSize={9}
          fontWeight={500}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {layer.shortLabel}
        </text>
      ))}
    </g>
  );
}

// ─── Constellation edges ──────────────────────────────────────────────────────

function ConnectionLines({ hoveredIdx }: { hoveredIdx: number | null }) {
  return (
    <g>
      {EDGES.map(([a, b]) => {
        const ga = goals[a];
        const gb = goals[b];
        const isActive = hoveredIdx === a || hoveredIdx === b;
        return (
          <line
            key={`${a}-${b}`}
            x1={ga.cx} y1={ga.cy}
            x2={gb.cx} y2={gb.cy}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={isActive ? 1.5 : 0.8}
            strokeOpacity={isActive ? 0.45 : 1}
            style={{ transition: 'all 0.3s ease' }}
          />
        );
      })}
    </g>
  );
}

// ─── Center / identity node ───────────────────────────────────────────────────

function CenterNode({ onClick }: { onClick: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Outer glow ring */}
      <circle cx={500} cy={340} r={62} fill="none" stroke="#008544" strokeOpacity={0.15} strokeWidth={20} className="center-glow-pulse" />
      {/* Main circle */}
      <circle cx={500} cy={340} r={52} fill="rgba(0,133,68,0.18)" stroke="#008544" strokeOpacity={0.6} strokeWidth={1.5} />
      {/* Inner */}
      <circle cx={500} cy={340} r={38} fill="rgba(0,133,68,0.10)" />

      {/* Text — "Somos" */}
      <text x={500} y={331} textAnchor="middle" fill="#00d97a" fontSize={11} fontWeight={700} letterSpacing={1} style={{ userSelect: 'none' }}>
        SOMOS
      </text>
      <text x={500} y={345} textAnchor="middle" fill="white" fontSize={9} fontWeight={600} style={{ userSelect: 'none' }}>
        MOUNT VERNON
      </text>
      {/* Student identity */}
      <text x={500} y={361} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize={7.5} style={{ userSelect: 'none', pointerEvents: 'none' }}>
        {STUDENT_IDENTITY.join(' · ')}
      </text>
    </g>
  );
}

// ─── Individual goal node ─────────────────────────────────────────────────────

function GoalNode({
  goal,
  index,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: {
  goal: (typeof goals)[0];
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hov: boolean) => void;
}) {
  const r = 32;
  const active = isSelected || isHovered;

  // Progress arc
  const pct = Math.min(goal.currentPct / 100, 1);
  const arcR = r + 6;
  const circumference = 2 * Math.PI * arcR;
  const dashOffset = circumference * (1 - pct);

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: active ? 1.12 : 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: 'pointer', transformOrigin: `${goal.cx}px ${goal.cy}px` }}
    >
      {/* Selection glow */}
      {active && (
        <circle
          cx={goal.cx} cy={goal.cy} r={r + 14}
          fill={goal.nodeColor}
          fillOpacity={0.12}
          stroke={goal.nodeColor}
          strokeOpacity={0.3}
          strokeWidth={1}
        />
      )}

      {/* Progress arc (behind) */}
      <circle
        cx={goal.cx} cy={goal.cy} r={arcR}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={4}
      />
      <circle
        cx={goal.cx} cy={goal.cy} r={arcR}
        fill="none"
        stroke={goal.nodeColor}
        strokeWidth={4}
        strokeOpacity={0.7}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${goal.cx} ${goal.cy})`}
      />

      {/* Main circle */}
      <circle
        cx={goal.cx} cy={goal.cy} r={r}
        fill={`${goal.nodeColor}22`}
        stroke={goal.nodeColor}
        strokeOpacity={active ? 0.9 : 0.55}
        strokeWidth={active ? 2 : 1.5}
      />

      {/* Emoji */}
      <text x={goal.cx} y={goal.cy - 4} textAnchor="middle" fontSize={16} style={{ userSelect: 'none' }}>
        {goal.emoji}
      </text>

      {/* Percentage */}
      <text
        x={goal.cx} y={goal.cy + 13}
        textAnchor="middle"
        fill="white"
        fontSize={10}
        fontWeight={700}
        style={{ userSelect: 'none' }}
      >
        {goal.currentPct}%
      </text>

      {/* Label below node */}
      <text
        x={goal.cx}
        y={goal.cy + r + 14}
        textAnchor="middle"
        fill={active ? 'white' : '#94a3b8'}
        fontSize={10}
        fontWeight={active ? 600 : 400}
        style={{ userSelect: 'none', transition: 'fill 0.2s' }}
      >
        {goal.shortTitle}
      </text>

      {/* Area dot */}
      <circle
        cx={goal.cx}
        cy={goal.cy + r + 26}
        r={3}
        fill={goal.areaColor}
        fillOpacity={0.7}
      />
    </motion.g>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────

export function ConstellationCanvas() {
  const { selectedGoalId, hoveredGoalId, toaVisible, selectGoal, hoverGoal } = useStore();

  const hoveredIdx = hoveredGoalId ? goals.findIndex((g) => g.id === hoveredGoalId) : null;

  const handleGoalSelect = useCallback(
    (id: string) => {
      selectGoal(selectedGoalId === id ? null : id);
    },
    [selectedGoalId, selectGoal]
  );

  return (
    <div className="w-full h-full relative">
      <svg
        viewBox="0 0 1000 680"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        {/* Deep space gradient background */}
        <defs>
          <radialGradient id="spaceGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0a1628" />
            <stop offset="100%" stopColor="#030712" />
          </radialGradient>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#008544" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#008544" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width={1000} height={680} fill="url(#spaceGrad)" />

        {/* Ambient center glow */}
        <ellipse cx={500} cy={340} rx={280} ry={200} fill="url(#centerGlow)" />

        <StarField />

        {toaVisible && <ToaRings />}

        <ConnectionLines hoveredIdx={hoveredIdx} />

        <CenterNode onClick={() => selectGoal(null)} />

        {goals.map((goal, i) => (
          <GoalNode
            key={goal.id}
            goal={goal}
            index={i}
            isSelected={selectedGoalId === goal.id}
            isHovered={hoveredGoalId === goal.id}
            onSelect={() => handleGoalSelect(goal.id)}
            onHover={(hov) => hoverGoal(hov ? goal.id : null)}
          />
        ))}
      </svg>

      {/* Mission tagline — bottom center overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-xs text-slate-600 italic">{MISSION}</p>
      </div>
    </div>
  );
}
