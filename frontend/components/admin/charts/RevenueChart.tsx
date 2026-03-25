'use client';
import { useMemo } from 'react';

interface Point {
  date: string | Date;
  grossCents: number;
  netCents: number;
  orderCount: number;
}

const W   = 560;
const H   = 148;
const PAD = { t: 14, r: 12, b: 30, l: 54 };
const cW  = W - PAD.l - PAD.r;
const cH  = H - PAD.t - PAD.b;

function shortMXN(c: number) {
  if (c >= 100_000_00) return `$${(c / 100_000_00).toFixed(1)}M`;
  if (c >= 1_000_00)   return `$${(c / 1_000_00).toFixed(1)}k`;
  return `$${(c / 100).toFixed(0)}`;
}

export default function RevenueChart({ data }: { data: Point[] }) {
  const paths = useMemo(() => {
    if (!data.length) return null;

    const maxVal = Math.max(...data.map(d => d.grossCents), 1);
    const n      = Math.max(data.length - 1, 1);

    const xs     = data.map((_, i) => PAD.l + (i / n) * cW);
    const netYs  = data.map(d  => PAD.t + cH - (d.netCents  / maxVal) * cH);
    const grYs   = data.map(d  => PAD.t + cH - (d.grossCents / maxVal) * cH);

    const netPts = xs.map((x, i) => `${x.toFixed(1)},${netYs[i].toFixed(1)}`).join(' ');
    const grPts  = xs.map((x, i) => `${x.toFixed(1)},${grYs[i].toFixed(1)}`).join(' ');

    const area = `M ${xs[0].toFixed(1)},${(PAD.t + cH).toFixed(1)} ` +
      xs.map((x, i) => `L ${x.toFixed(1)},${netYs[i].toFixed(1)}`).join(' ') +
      ` L ${xs[xs.length - 1].toFixed(1)},${(PAD.t + cH).toFixed(1)} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
      y:     PAD.t + cH - t * cH,
      label: shortMXN(t * maxVal),
    }));

    const step    = Math.max(1, Math.floor(data.length / 6));
    const xLabels = data
      .map((d, i) => ({ d, i }))
      .filter(({ i }) => i === 0 || i === data.length - 1 || i % step === 0)
      .map(({ d, i }) => ({
        x:     PAD.l + (i / n) * cW,
        label: new Date(d.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      }));

    return { netPts, grPts, area, yTicks, xLabels };
  }, [data]);

  if (!paths) {
    return (
      <div className="flex items-center justify-center h-36 text-slate-300 text-sm">
        Sin datos para el período
      </div>
    );
  }

  const { netPts, grPts, area, yTicks, xLabels } = paths;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '148px' }}>
      {/* Grid lines + Y labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={t.y} x2={W - PAD.r} y2={t.y}
            stroke="#f1f5f9" strokeWidth="1" />
          <text x={PAD.l - 6} y={t.y + 3.5} textAnchor="end" fontSize="8.5" fill="#94a3b8">
            {t.label}
          </text>
        </g>
      ))}

      {/* Gross (dashed, subtle) */}
      <polyline points={grPts} fill="none"
        stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Area fill */}
      <path d={area} fill="#6366f1" fillOpacity="0.07" />

      {/* Net line */}
      <polyline points={netPts} fill="none"
        stroke="#6366f1" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* X labels */}
      {xLabels.map((l, i) => (
        <text key={i} x={l.x} y={H - 5} textAnchor="middle" fontSize="8.5" fill="#94a3b8">
          {l.label}
        </text>
      ))}
    </svg>
  );
}
