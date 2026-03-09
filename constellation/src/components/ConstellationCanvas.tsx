import React, { useMemo, useCallback, useEffect } from 'react';
import { motion, useSpring, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { goals, type Goal, EDGES } from '../data/goals';
import { TOA_LAYERS, STUDENT_IDENTITY, MISSION } from '../data/toa';
import { useStore } from '../store';

// ─── Seeded RNG ────────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Bezier path helper ────────────────────────────────────────────────────────

function bezierPath(x1: number, y1: number, x2: number, y2: number, curvature = 32): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cpx = mx - (dy / len) * curvature;
  const cpy = my + (dx / len) * curvature;
  return `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;
}

// ─── Nebula clouds ─────────────────────────────────────────────────────────────

const CLOUDS = [
  { cx: 175, cy: 135, rx: 215, ry: 160, color: '#7c3aed', dur: 14, delay: 0  },
  { cx: 800, cy: 185, rx: 190, ry: 145, color: '#008544', dur: 17, delay: 3  },
  { cx: 740, cy: 535, rx: 235, ry: 175, color: '#2563eb', dur: 12, delay: 6  },
  { cx: 235, cy: 545, rx: 205, ry: 155, color: '#d97706', dur: 15, delay: 2  },
  { cx: 500, cy: 340, rx: 275, ry: 210, color: '#008544', dur: 20, delay: 9  },
];

function NebulaClouds() {
  return (
    <g>
      <defs>
        {CLOUDS.map((c, i) => (
          <radialGradient key={i} id={`neb-${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={c.color} stopOpacity="0.11" />
            <stop offset="65%"  stopColor={c.color} stopOpacity="0.04" />
            <stop offset="100%" stopColor={c.color} stopOpacity="0"    />
          </radialGradient>
        ))}
      </defs>
      {CLOUDS.map((c, i) => (
        <motion.ellipse
          key={i}
          cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry}
          fill={`url(#neb-${i})`}
          animate={{ opacity: [0.55, 1, 0.55], rx: [c.rx * 0.88, c.rx * 1.12, c.rx * 0.88] }}
          transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </g>
  );
}

// ─── Star field (two parallax layers) ─────────────────────────────────────────

function StarField() {
  const far = useMemo(() => {
    const rng = seededRng(42);
    return Array.from({ length: 145 }, (_, i) => ({
      id: i, cx: rng() * 1000, cy: rng() * 680,
      r: rng() * 1.2 + 0.3,
      opacity: rng() * 0.5 + 0.1,
      dur: rng() * 4 + 2, delay: rng() * 6,
    }));
  }, []);

  const near = useMemo(() => {
    const rng = seededRng(99);
    return Array.from({ length: 40 }, (_, i) => ({
      id: i, cx: rng() * 1000, cy: rng() * 680,
      r: rng() * 1.5 + 0.5,
      opacity: rng() * 0.65 + 0.2,
      dur: rng() * 3 + 1.5, delay: rng() * 4,
    }));
  }, []);

  return (
    <g>
      {far.map(s => (
        <circle
          key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill="white"
          className="star-twinkle"
          style={{
            '--duration': `${s.dur}s`, '--delay': `${s.delay}s`,
            '--min-opacity': s.opacity * 0.2, '--max-opacity': s.opacity,
          } as React.CSSProperties}
        />
      ))}
      <motion.g
        animate={{ x: [0, 5, 0, -4, 0], y: [0, 3, 6, 2, 0] }}
        transition={{ duration: 48, repeat: Infinity, ease: 'easeInOut' }}
      >
        {near.map(s => (
          <circle
            key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill="white"
            className="star-twinkle"
            style={{
              '--duration': `${s.dur}s`, '--delay': `${s.delay}s`,
              '--min-opacity': s.opacity * 0.3, '--max-opacity': s.opacity,
            } as React.CSSProperties}
          />
        ))}
      </motion.g>
    </g>
  );
}

// ─── TOA rings ─────────────────────────────────────────────────────────────────

function ToaRings() {
  return (
    <g>
      {[...TOA_LAYERS].reverse().map((layer, i) => (
        <motion.circle
          key={layer.key}
          cx={500} cy={340} r={layer.radius}
          fill={layer.color} fillOpacity={layer.opacity * 0.9}
          stroke={layer.color} strokeOpacity={0.22} strokeWidth={0.8}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
        />
      ))}
      {TOA_LAYERS.map(layer => (
        <text
          key={`lbl-${layer.key}`}
          x={500 + layer.radius + 6} y={339}
          fill={layer.color} fillOpacity={0.45}
          fontSize={8.5} fontWeight={500}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {layer.shortLabel}
        </text>
      ))}
    </g>
  );
}

// ─── Animated bezier edges ─────────────────────────────────────────────────────

function AnimatedEdges({ selectedIdx, hoveredIdx }: { selectedIdx: number | null; hoveredIdx: number | null }) {
  return (
    <g>
      {EDGES.map(([a, b]) => {
        const ga = goals[a], gb = goals[b];
        const isConnected = selectedIdx === a || selectedIdx === b || hoveredIdx === a || hoveredIdx === b;
        const isActive = selectedIdx !== null && (selectedIdx === a || selectedIdx === b);
        const activeColor = isActive ? goals[selectedIdx!].nodeColor : 'rgba(255,255,255,0.3)';
        const d = bezierPath(ga.cx, ga.cy, gb.cx, gb.cy, 30);
        return (
          <g key={`${a}-${b}`}>
            {/* base ghost */}
            <path d={d} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1.2} />
            {/* active animated path */}
            {isConnected && (
              <motion.path
                d={d} fill="none"
                stroke={activeColor}
                strokeWidth={isActive ? 2 : 1}
                strokeLinecap="round"
                style={{ strokeDasharray: isActive ? '10 6' : 'none' }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: isActive ? 0.85 : 0.4,
                  strokeDashoffset: isActive ? [0, -48] : 0,
                }}
                transition={{
                  pathLength: { duration: 0.5, ease: 'easeOut' },
                  opacity: { duration: 0.3 },
                  strokeDashoffset: { duration: 2.5, repeat: Infinity, ease: 'linear' },
                }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

// ─── Center node ───────────────────────────────────────────────────────────────

function CenterNode({ onClick }: { onClick: () => void }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {[92, 74, 58].map((r, i) => (
        <motion.circle
          key={r} cx={500} cy={340} r={r}
          fill="none" stroke="#008544"
          strokeOpacity={0.05 + i * 0.05} strokeWidth={i === 2 ? 1.5 : 0.8}
          animate={{ r: [r, r * 1.07, r], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3 + i * 1.5, repeat: Infinity, ease: 'easeInOut', delay: i }}
        />
      ))}
      <circle cx={500} cy={340} r={52} fill="rgba(0,133,68,0.18)" stroke="#008544" strokeOpacity={0.6} strokeWidth={1.5} />
      <circle cx={500} cy={340} r={38} fill="rgba(0,133,68,0.08)" />
      <text x={500} y={331} textAnchor="middle" fill="#00d97a" fontSize={11} fontWeight={700} letterSpacing={1} style={{ userSelect: 'none', pointerEvents: 'none' }}>
        SOMOS
      </text>
      <text x={500} y={345} textAnchor="middle" fill="white" fontSize={9} fontWeight={600} style={{ userSelect: 'none', pointerEvents: 'none' }}>
        MOUNT VERNON
      </text>
      <text x={500} y={361} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize={7.5} style={{ userSelect: 'none', pointerEvents: 'none' }}>
        {STUDENT_IDENTITY.join(' · ')}
      </text>
    </g>
  );
}

// ─── Goal node ─────────────────────────────────────────────────────────────────

function GoalNode({ goal, index, isSelected, isHovered, isDimmed, onSelect, onHover }: {
  goal: Goal; index: number;
  isSelected: boolean; isHovered: boolean; isDimmed: boolean;
  onSelect: () => void; onHover: (h: boolean) => void;
}) {
  const rng = seededRng(index * 7919);
  const dx1 = (rng() - 0.5) * 9, dy1 = (rng() - 0.5) * 7;
  const dx2 = (rng() - 0.5) * 8, dy2 = (rng() - 0.5) * 9;
  const dur  = 14 + rng() * 12;

  const r = 32;
  const arcR = r + 6;
  const circum = 2 * Math.PI * arcR;
  const dashOff = circum * (1 - Math.min(goal.currentPct / 100, 1));

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: isDimmed ? 0.12 : 1 }}
      transition={{ delay: index * 0.07, duration: 0.45 }}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Ambient orbit drift */}
      <motion.g
        animate={{ x: [0, dx1, dx2, dx1 * 0.4, 0], y: [0, dy1, dy2, dy2 * 0.4, 0] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Selection halo */}
        {(isSelected || isHovered) && (
          <motion.circle
            cx={goal.cx} cy={goal.cy} r={r + 20}
            fill={goal.nodeColor} fillOpacity={0.07}
            stroke={goal.nodeColor} strokeOpacity={0.25} strokeWidth={1}
            animate={{ r: [r + 16, r + 28, r + 16], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Progress arc track */}
        <circle cx={goal.cx} cy={goal.cy} r={arcR} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
        {/* Progress arc fill */}
        <circle
          cx={goal.cx} cy={goal.cy} r={arcR}
          fill="none" stroke={goal.nodeColor}
          strokeWidth={4} strokeOpacity={0.8}
          strokeDasharray={`${circum} ${circum}`}
          strokeDashoffset={dashOff}
          strokeLinecap="round"
          transform={`rotate(-90 ${goal.cx} ${goal.cy})`}
        />

        {/* Node body */}
        <circle
          cx={goal.cx} cy={goal.cy} r={r}
          fill={`${goal.nodeColor}1e`}
          stroke={goal.nodeColor}
          strokeOpacity={isSelected || isHovered ? 0.9 : 0.5}
          strokeWidth={isSelected ? 2.5 : 1.5}
        />

        {/* Emoji */}
        <text x={goal.cx} y={goal.cy - 4} textAnchor="middle" fontSize={16} style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {goal.emoji}
        </text>
        {/* Percentage */}
        <text x={goal.cx} y={goal.cy + 13} textAnchor="middle" fill="white" fontSize={10} fontWeight={700} style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {goal.currentPct}%
        </text>
        {/* Short title */}
        <text
          x={goal.cx} y={goal.cy + r + 14} textAnchor="middle"
          fill={isSelected || isHovered ? 'white' : '#94a3b8'}
          fontSize={10} fontWeight={isSelected ? 600 : 400}
          style={{ userSelect: 'none', pointerEvents: 'none', transition: 'fill 0.3s' }}
        >
          {goal.shortTitle}
        </text>
        {/* Area colour dot */}
        <circle cx={goal.cx} cy={goal.cy + r + 26} r={3} fill={goal.areaColor} fillOpacity={0.7} />
      </motion.g>
    </motion.g>
  );
}

// ─── In-map stat card ──────────────────────────────────────────────────────────

const CARD_POS: Record<string, { dx: number; dy: number }> = {
  attendance:  { dx: -97,  dy:  52  },
  irla:        { dx: -215, dy:  18  },
  grade6:      { dx: -218, dy: -30  },
  msmath:      { dx: -97,  dy: -128 },
  ninth:       { dx:  15,  dy: -128 },
  biliteracy:  { dx:  18,  dy: -30  },
  graduation:  { dx:  18,  dy:  18  },
};

function InMapCard({ goal }: { goal: Goal }) {
  const off = CARD_POS[goal.id] ?? { dx: -97, dy: 52 };
  const x = goal.cx + off.dx;
  const y = goal.cy + off.dy;
  const W = 195, pad = 12;
  const H = goal.callout ? 118 : 90;
  const barTrack = W - pad * 2;
  const barFill  = Math.min(barTrack, barTrack * (goal.currentPct / goal.targetPct));

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.78 }}
      style={{ transformOrigin: `${goal.cx}px ${goal.cy}px` }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.18 }}
    >
      {/* Drop shadow */}
      <rect x={x + 3} y={y + 3} width={W} height={H} rx={10} fill="rgba(0,0,0,0.45)" />
      {/* Card body */}
      <rect x={x} y={y} width={W} height={H} rx={10} fill="rgba(5,11,28,0.95)" stroke={goal.nodeColor} strokeOpacity={0.35} strokeWidth={1} />

      {/* Area label */}
      <text x={x + pad} y={y + pad + 9} fill={goal.areaColor} fontSize={7.5} fontWeight={700} style={{ userSelect: 'none', pointerEvents: 'none' }}>
        {goal.areaLabel.toUpperCase()}
      </text>

      {/* Big number */}
      <text x={x + pad} y={y + pad + 35} fill={goal.nodeColor} fontSize={23} fontWeight={800} style={{ userSelect: 'none', pointerEvents: 'none' }}>
        {goal.currentPct}%
      </text>
      <text x={x + pad + 65} y={y + pad + 35} fill="rgba(255,255,255,0.4)" fontSize={8} style={{ userSelect: 'none', pointerEvents: 'none' }}>
        {goal.currentLabel}
      </text>

      {/* Progress bar */}
      <rect x={x + pad} y={y + 57} width={barTrack} height={4} rx={2} fill="rgba(255,255,255,0.08)" />
      <motion.rect
        x={x + pad} y={y + 57} height={4} rx={2}
        fill={goal.nodeColor}
        initial={{ width: 0 }}
        animate={{ width: barFill }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
      />

      {/* Goal text */}
      <text x={x + pad} y={y + 72} fill="rgba(255,255,255,0.3)" fontSize={7.5} style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Goal: {goal.targetPct}% by 2031
      </text>

      {/* Callout */}
      {goal.callout && (
        <>
          <line x1={x + pad} y1={y + 80} x2={x + W - pad} y2={y + 80} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
          <text x={x + pad} y={y + 94} fill="white" fontSize={9} fontWeight={700} style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {goal.callout.value}
          </text>
          <text x={x + pad} y={y + 107} fill="rgba(255,255,255,0.38)" fontSize={7.5} style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {goal.callout.label}
          </text>
        </>
      )}
    </motion.g>
  );
}

// ─── Main canvas ───────────────────────────────────────────────────────────────

export function ConstellationCanvas() {
  const { selectedGoalId, hoveredGoalId, toaVisible, selectGoal, hoverGoal } = useStore();

  const SPRING = { stiffness: 62, damping: 17 };
  const vbX = useSpring(0,    SPRING);
  const vbY = useSpring(0,    SPRING);
  const vbW = useSpring(1000, SPRING);
  const vbH = useSpring(680,  SPRING);
  const viewBox = useMotionTemplate`${vbX} ${vbY} ${vbW} ${vbH}`;

  const selectedGoal = goals.find(g => g.id === selectedGoalId) ?? null;
  const selectedIdx  = selectedGoal ? goals.indexOf(selectedGoal) : null;
  const hoveredIdx   = hoveredGoalId ? goals.findIndex(g => g.id === hoveredGoalId) : null;

  useEffect(() => {
    if (selectedGoal) {
      const zoom = 2.35;
      const newW = 1000 / zoom;
      const newH = 680 / zoom;
      vbX.set(Math.max(0, Math.min(1000 - newW, selectedGoal.cx - newW / 2)));
      vbY.set(Math.max(0, Math.min(680  - newH, selectedGoal.cy - newH / 2)));
      vbW.set(newW);
      vbH.set(newH);
    } else {
      vbX.set(0); vbY.set(0); vbW.set(1000); vbH.set(680);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGoalId]);

  const handleSelect = useCallback((id: string) => {
    selectGoal(selectedGoalId === id ? null : id);
  }, [selectedGoalId, selectGoal]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <motion.svg
        viewBox={viewBox}
        width="100%" height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          <radialGradient id="spaceGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%"   stopColor="#0b1525" />
            <stop offset="100%" stopColor="#030712" />
          </radialGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background gradient */}
        <rect width={1000} height={680} fill="url(#spaceGrad)" />

        {/* Nebula clouds — deepest layer */}
        <NebulaClouds />

        {/* Stars — two parallax layers */}
        <StarField />

        {/* Theory of Action rings */}
        {toaVisible && <ToaRings />}

        {/* Constellation edges */}
        <AnimatedEdges selectedIdx={selectedIdx} hoveredIdx={hoveredIdx} />

        {/* Center identity node */}
        <CenterNode onClick={() => selectGoal(null)} />

        {/* Goal nodes */}
        {goals.map((goal, i) => (
          <GoalNode
            key={goal.id}
            goal={goal} index={i}
            isSelected={selectedGoalId === goal.id}
            isHovered={hoveredGoalId === goal.id}
            isDimmed={selectedGoalId !== null && selectedGoalId !== goal.id}
            onSelect={() => handleSelect(goal.id)}
            onHover={(h) => hoverGoal(h ? goal.id : null)}
          />
        ))}

        {/* In-map floating stat card */}
        <AnimatePresence>
          {selectedGoal && <InMapCard key={selectedGoal.id} goal={selectedGoal} />}
        </AnimatePresence>
      </motion.svg>

      {/* Mission tagline */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-xs text-slate-700 italic text-center">{MISSION}</p>
      </div>
    </div>
  );
}
