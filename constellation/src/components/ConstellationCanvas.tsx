import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { goals, type Goal, type Planet, EDGES } from '../data/goals';
import { TOA_LAYERS, STUDENT_IDENTITY, MISSION } from '../data/toa';
import { useStore } from '../store';

// ─── Mobile / coarse-pointer detection ─────────────────────────────────────────

function useCoarsePointer(): boolean {
  return useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  );
}

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
  const mobile = useCoarsePointer();
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
      {CLOUDS.map((c, i) =>
        mobile ? (
          <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={`url(#neb-${i})`} opacity={0.7} />
        ) : (
          <motion.ellipse
            key={i}
            cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry}
            fill={`url(#neb-${i})`}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        )
      )}
    </g>
  );
}

// ─── Star field (two parallax layers) ─────────────────────────────────────────

function StarField() {
  const { selectedGoalId } = useStore();
  const mobile = useCoarsePointer();

  const far = useMemo(() => {
    const rng = seededRng(42);
    return Array.from({ length: mobile ? 50 : 145 }, (_, i) => ({
      id: i, cx: rng() * 1000, cy: rng() * 680,
      r: rng() * 1.2 + 0.3,
      opacity: rng() * 0.5 + 0.1,
      dur: rng() * 4 + 2, delay: rng() * 6,
    }));
  }, [mobile]);

  const near = useMemo(() => {
    if (mobile) return [];
    const rng = seededRng(99);
    return Array.from({ length: 40 }, (_, i) => ({
      id: i, cx: rng() * 1000, cy: rng() * 680,
      r: rng() * 1.5 + 0.5,
      opacity: rng() * 0.65 + 0.2,
      dur: rng() * 3 + 1.5, delay: rng() * 4,
    }));
  }, [mobile]);

  return (
    <g>
      {far.map(s =>
        mobile ? (
          <circle key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.opacity} />
        ) : (
          <circle
            key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill="white"
            className="star-twinkle"
            style={{
              '--duration': `${s.dur}s`, '--delay': `${s.delay}s`,
              '--min-opacity': s.opacity * 0.2, '--max-opacity': s.opacity,
            } as React.CSSProperties}
          />
        )
      )}
      {!mobile && (
        <motion.g
          animate={selectedGoalId ? { x: 0, y: 0 } : { x: [0, 5, 0, -4, 0], y: [0, 3, 6, 2, 0] }}
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
      )}
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
      {TOA_LAYERS.map((layer, i) => (
        <text
          key={`lbl-${layer.key}`}
          x={500 + layer.radius + 6} y={i % 2 === 0 ? 332 : 348}
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
          animate={{ opacity: [0.3, 0.9, 0.3] }}
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
      {/* Ambient orbit drift — paused when dimmed to reduce GPU load */}
      <motion.g
        animate={isDimmed ? { x: 0, y: 0 } : { x: [0, dx1, dx2, dx1 * 0.4, 0], y: [0, dy1, dy2, dy2 * 0.4, 0] }}
        transition={isDimmed ? { duration: 0.4 } : { duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Selection halo */}
        {(isSelected || isHovered) && (
          <motion.circle
            cx={goal.cx} cy={goal.cy} r={r + 22}
            fill={goal.nodeColor} fillOpacity={0.07}
            stroke={goal.nodeColor} strokeOpacity={0.25} strokeWidth={1}
            animate={{ opacity: [0.35, 0.85, 0.35] }}
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

// ─── Solar system — orbiting planets with drag-to-spin ─────────────────────────

/** Pure visual component – position is driven externally via the group's SVG transform */
function PlanetBody({ planet, color, groupRef, onPointerDown, onPointerMove, onPointerUp }: {
  planet: Planet;
  color: string;
  groupRef: (el: SVGGElement | null) => void;
  onPointerDown: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGGElement>) => void;
}) {
  return (
    <g
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ cursor: 'grab', willChange: 'transform' }}
    >
      {/* Invisible hit area — larger than the visual planet */}
      <circle cx={0} cy={0} r={planet.size + 10} fill="transparent" />
      {/* Glow halo */}
      <circle cx={0} cy={0} r={planet.size + 5} fill={color} fillOpacity={0.12} />
      {/* Planet body */}
      <circle cx={0} cy={0} r={planet.size} fill={color} fillOpacity={0.9} />
      {/* Specular highlight */}
      <circle
        cx={-planet.size * 0.3} cy={-planet.size * 0.3}
        r={planet.size * 0.32}
        fill="rgba(255,255,255,0.22)"
      />
      {/* Value label above planet */}
      <text
        x={0} y={-(planet.size + 5)}
        textAnchor="middle" fill="white"
        fontSize={7} fontWeight={700}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {planet.value}
      </text>
      {/* Group label below planet */}
      <text
        x={0} y={planet.size + 11}
        textAnchor="middle" fill="rgba(255,255,255,0.55)"
        fontSize={5.5}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {planet.label}
      </text>
    </g>
  );
}

/** Converts a React pointer event's clientX/Y to SVG coordinate space */
function getSvgPt(e: React.PointerEvent<SVGGElement>): { x: number; y: number } {
  const svg = (e.currentTarget as Element).closest('svg') as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  const raw = svg.getAttribute('viewBox') ?? '0 0 1000 680';
  const [vx, vy, vw, vh] = raw.trim().split(/\s+/).map(Number);
  return {
    x: vx + ((e.clientX - rect.left) / rect.width) * vw,
    y: vy + ((e.clientY - rect.top) / rect.height) * vh,
  };
}

function SolarSystem({ goal }: { goal: Goal }) {
  const planets = goal.planets;
  if (!planets?.length) return null;
  const n = planets.length;

  // Refs for direct DOM updates (no React re-renders during animation)
  const groupRefs = useRef<(SVGGElement | null)[]>(Array(n).fill(null));
  const stateRef = useRef({
    phases: planets.map((_, i) => i / n),   // each planet's current orbit phase [0,1)
    speed: 1,                                 // global speed multiplier (decays → 1)
    drag: null as {
      idx: number;
      lastAngle: number;
      lastTime: number;
      vel: number;        // angular velocity in rad/s at moment of release
    } | null,
  });

  // Single shared RAF loop — advances phases and writes SVG transforms
  useEffect(() => {
    let raf: number;
    let prev = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const s = stateRef.current;

      // Exponential decay of speed multiplier back to 1.0 — only when not dragging
      if (!s.drag) {
        s.speed = 1 + (s.speed - 1) * Math.exp(-dt * 0.55);
        if (Math.abs(s.speed - 1) < 0.002) s.speed = 1;
      }

      planets.forEach((p, i) => {
        // Dragged planet: its phase is set directly from the cursor, not advanced by time
        if (!s.drag || s.drag.idx !== i) {
          s.phases[i] = (s.phases[i] + (dt / p.period) * s.speed) % 1;
        }
        const angle = s.phases[i] * 2 * Math.PI;
        const x = goal.cx + Math.cos(angle) * p.orbitRadius;
        const y = goal.cy + Math.sin(angle) * p.orbitRadius;
        groupRefs.current[i]?.setAttribute(
          'transform', `translate(${x.toFixed(2)},${y.toFixed(2)})`
        );
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pointer handlers (drag-to-fling mechanic) ──────────────────────────────

  const onDown = (e: React.PointerEvent<SVGGElement>, idx: number) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const pt = getSvgPt(e);
    const a = Math.atan2(pt.y - goal.cy, pt.x - goal.cx);
    stateRef.current.drag = { idx, lastAngle: a, lastTime: performance.now(), vel: 0 };
  };

  const onMove = (e: React.PointerEvent<SVGGElement>, idx: number) => {
    const d = stateRef.current.drag;
    if (!d || d.idx !== idx) return;

    const pt = getSvgPt(e);
    const a = Math.atan2(pt.y - goal.cy, pt.x - goal.cx);
    const now = performance.now();
    const dt = (now - d.lastTime) / 1000;

    if (dt > 0.005) {
      let da = a - d.lastAngle;
      // Unwrap angle to avoid discontinuity at ±π
      if (da > Math.PI)  da -= 2 * Math.PI;
      if (da < -Math.PI) da += 2 * Math.PI;
      d.vel = da / dt;

      // Apply speed to ALL planets in real-time while dragging
      const naturalAngVel = (2 * Math.PI) / planets[idx].period;
      const mult = d.vel / naturalAngVel;
      stateRef.current.speed = mult > 0.1 ? Math.min(mult, 14) : Math.max(0, mult + 1);
    }

    // Snap planet position to cursor angle on the orbit circle
    stateRef.current.phases[idx] = ((a / (2 * Math.PI)) % 1 + 1) % 1;
    d.lastAngle = a;
    d.lastTime = now;
  };

  const onUp = (e: React.PointerEvent<SVGGElement>, idx: number) => {
    const d = stateRef.current.drag;
    if (!d || d.idx !== idx) return;

    // Convert angular velocity at release into a speed multiplier
    // (based on this planet's natural angular velocity = 2π / period)
    const naturalAngVel = (2 * Math.PI) / planets[idx].period;
    const mult = d.vel / naturalAngVel;
    if (mult > 1.5) {
      // All planets inherit proportionally (relative speeds maintained)
      stateRef.current.speed = Math.min(mult, 14);
    }

    stateRef.current.drag = null;
  };

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      {/* Orbit guide rings */}
      {planets.map((p) => (
        <circle
          key={`ring-${p.label}`}
          cx={goal.cx} cy={goal.cy} r={p.orbitRadius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={0.5}
          strokeDasharray="3 6"
        />
      ))}
      {/* Planets */}
      {planets.map((p, i) => (
        <PlanetBody
          key={p.label}
          planet={p}
          color={p.color ?? goal.nodeColor}
          groupRef={(el) => { groupRefs.current[i] = el; }}
          onPointerDown={(e) => onDown(e, i)}
          onPointerMove={(e) => onMove(e, i)}
          onPointerUp={(e) => onUp(e, i)}
        />
      ))}
    </motion.g>
  );
}

// ─── Main canvas ───────────────────────────────────────────────────────────────

export function ConstellationCanvas() {
  const { selectedGoalId, hoveredGoalId, toaVisible, selectGoal, hoverGoal, openSomos } = useStore();
  const mobile = useCoarsePointer();

  // Faster spring on mobile — fewer frames of simultaneous spring + RAF work
  const SPRING = mobile
    ? { stiffness: 220, damping: 32 }
    : { stiffness: 62,  damping: 17 };
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
      const zoom = 3.2;
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
        <CenterNode onClick={openSomos} />

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

        {/* Solar system — orbiting planets for selected goal */}
        <AnimatePresence>
          {selectedGoal && <SolarSystem key={selectedGoal.id} goal={selectedGoal} />}
        </AnimatePresence>
      </motion.svg>

      {/* Mission tagline */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-xs text-slate-700 italic text-center">{MISSION}</p>
      </div>
    </div>
  );
}
