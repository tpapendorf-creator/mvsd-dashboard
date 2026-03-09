import React from 'react';
import type { BarChart, StackedBarChart, TimelineChart, ChartDef } from '../data/goals';

// ─── Horizontal / Vertical Bar ────────────────────────────────────────────────

export function BarChartViz({ chart }: { chart: BarChart }) {
  const max = chart.target ? Math.max(...chart.values, chart.target) * 1.05 : Math.max(...chart.values) * 1.15;

  if (chart.horizontal) {
    const barH = 22;
    const labelW = 148;
    const chartW = 260;
    const height = chart.labels.length * (barH + 8) + 32;

    return (
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">{chart.title}</p>
        <svg width="100%" viewBox={`0 0 ${labelW + chartW + 16} ${height}`} style={{ overflow: 'visible' }}>
          {chart.target && (
            <line
              x1={labelW + (chart.target / max) * chartW}
              y1={0}
              x2={labelW + (chart.target / max) * chartW}
              y2={height - 24}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}
          {chart.labels.map((label, i) => {
            const barW = (chart.values[i] / max) * chartW;
            const color = chart.colors?.[i] ?? '#008544';
            const y = i * (barH + 8);
            return (
              <g key={label}>
                <text x={labelW - 8} y={y + barH / 2 + 5} textAnchor="end" fill="#94a3b8" fontSize={11}>
                  {label}
                </text>
                <rect x={labelW} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.85} />
                <text x={labelW + barW + 5} y={y + barH / 2 + 5} fill="white" fontSize={11} fontWeight={600}>
                  {chart.values[i]}{chart.unit ?? '%'}
                </text>
              </g>
            );
          })}
          {chart.target && (
            <text
              x={labelW + (chart.target / max) * chartW}
              y={height - 8}
              textAnchor="middle"
              fill="rgba(255,255,255,0.45)"
              fontSize={10}
            >
              {chart.targetLabel}
            </text>
          )}
        </svg>
      </div>
    );
  }

  // Vertical
  const chartH = 120;
  const barW = Math.min(40, Math.floor(240 / chart.labels.length) - 8);
  const gap = Math.floor(240 / chart.labels.length);
  const width = chart.labels.length * gap + 24;

  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">{chart.title}</p>
      <svg width="100%" viewBox={`0 0 ${width} ${chartH + 36}`} style={{ overflow: 'visible' }}>
        {chart.labels.map((label, i) => {
          const bh = (chart.values[i] / max) * chartH;
          const x = 12 + i * gap + (gap - barW) / 2;
          const color = chart.colors?.[i] ?? '#008544';
          return (
            <g key={label}>
              <rect x={x} y={chartH - bh} width={barW} height={bh} rx={3} fill={color} opacity={0.85} />
              <text x={x + barW / 2} y={chartH - bh - 4} textAnchor="middle" fill="white" fontSize={10} fontWeight={600}>
                {chart.values[i]}{chart.unit ?? '%'}
              </text>
              {label.split('\n').map((line, li) => (
                <text
                  key={li}
                  x={x + barW / 2}
                  y={chartH + 14 + li * 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={10}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Stacked Bar ──────────────────────────────────────────────────────────────

export function StackedBarViz({ chart }: { chart: StackedBarChart }) {
  const totals = chart.labels.map((_, i) =>
    chart.datasets.reduce((sum, ds) => sum + ds.values[i], 0)
  );
  const maxTotal = Math.max(...totals);
  const chartH = 110;
  const barW = 48;
  const gap = 72;
  const width = chart.labels.length * gap + 24;

  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">{chart.title}</p>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {chart.datasets.map((ds) => (
          <div key={ds.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: ds.color }} />
            <span className="text-xs text-slate-400">{ds.label}</span>
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${chartH + 36}`} style={{ overflow: 'visible' }}>
        {chart.labels.map((label, i) => {
          let yOff = 0;
          const total = totals[i];
          const x = 12 + i * gap + (gap - barW) / 2;
          return (
            <g key={label}>
              {chart.datasets.map((ds) => {
                const bh = (ds.values[i] / maxTotal) * chartH;
                const yPos = chartH - yOff - bh;
                yOff += bh;
                return (
                  <rect key={ds.label} x={x} y={yPos} width={barW} height={bh} fill={ds.color} opacity={0.88} />
                );
              })}
              <text x={x + barW / 2} y={chartH - (total / maxTotal) * chartH - 5} textAnchor="middle" fill="white" fontSize={10} fontWeight={600}>
                {total}
              </text>
              {label.split('\n').map((line, li) => (
                <text key={li} x={x + barW / 2} y={chartH + 14 + li * 12} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Timeline / Line Chart ────────────────────────────────────────────────────

export function TimelineViz({ chart }: { chart: TimelineChart }) {
  const allVals = chart.datasets.flatMap((ds) => ds.values.filter((v): v is number => v !== null));
  const minV = Math.min(...allVals) * 0.92;
  const maxV = Math.max(...allVals) * 1.06;
  const chartH = 100;
  const chartW = 320;
  const padL = 32;
  const padB = 28;
  const n = chart.labels.length;
  const xStep = (chartW - padL) / (n - 1);

  const toX = (i: number) => padL + i * xStep;
  const toY = (v: number) => chartH - ((v - minV) / (maxV - minV)) * chartH;

  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">{chart.title}</p>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {chart.datasets.map((ds) => (
          <div key={ds.label} className="flex items-center gap-1.5">
            <svg width={24} height={10}>
              <line x1={0} y1={5} x2={24} y2={5} stroke={ds.color} strokeWidth={2} strokeDasharray={ds.dashed ? '4 3' : undefined} />
            </svg>
            <span className="text-xs text-slate-400">{ds.label}</span>
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${chartW + padL} ${chartH + padB + 16}`} style={{ overflow: 'visible' }}>
        {/* Y-axis labels */}
        {[minV, (minV + maxV) / 2, maxV].map((v) => (
          <text key={v} x={padL - 4} y={toY(v) + 4} textAnchor="end" fill="#475569" fontSize={9}>
            {Math.round(v)}
          </text>
        ))}
        {/* Grid lines */}
        {[minV, (minV + maxV) / 2, maxV].map((v) => (
          <line key={v} x1={padL} y1={toY(v)} x2={chartW + padL} y2={toY(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}
        {/* Lines + dots */}
        {chart.datasets.map((ds) => {
          const pts = ds.values
            .map((v, i) => (v !== null ? `${toX(i)},${toY(v)}` : null))
            .filter(Boolean) as string[];
          const path = 'M ' + pts.join(' L ');
          return (
            <g key={ds.label}>
              <path d={path} fill="none" stroke={ds.color} strokeWidth={2} strokeDasharray={ds.dashed ? '5 4' : undefined} />
              {ds.values.map((v, i) =>
                v !== null ? (
                  <g key={i}>
                    <circle cx={toX(i)} cy={toY(v)} r={4} fill={ds.color} />
                    <text x={toX(i)} y={toY(v) - 8} textAnchor="middle" fill={ds.color} fontSize={10} fontWeight={600}>
                      {v}
                    </text>
                  </g>
                ) : null
              )}
            </g>
          );
        })}
        {/* X labels */}
        {chart.labels.map((label, i) =>
          label.split('\n').map((line, li) => (
            <text key={`${i}-${li}`} x={toX(i)} y={chartH + padB - 4 + li * 11} textAnchor="middle" fill="#475569" fontSize={9}>
              {line}
            </text>
          ))
        )}
      </svg>
    </div>
  );
}

// ─── Unified dispatcher ───────────────────────────────────────────────────────

export function ChartViz({ chart }: { chart: ChartDef }) {
  switch (chart.type) {
    case 'bar':         return <BarChartViz chart={chart} />;
    case 'stacked-bar': return <StackedBarViz chart={chart} />;
    case 'timeline':    return <TimelineViz chart={chart} />;
  }
}
