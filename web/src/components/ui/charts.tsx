"use client";

// Lightweight, dependency-free SVG charts with on-brand styling.
// UI/UX Pro Max P10: subtle gridlines, accessible labels, tabular figures,
// data contrast ≥3:1, text summaries via aria-label.

import { cn } from "@/lib/cn";

// ── Donut / gauge ────────────────────────────────────────────────────────────
export function Gauge({
  value,
  size = 132,
  stroke = 12,
  color = "var(--color-success)",
  track = "#eceef6",
  label,
  sublabel,
  className,
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pctv = Math.max(0, Math.min(100, value));
  const dash = (pctv / 100) * c;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${pctv}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label ?? <span className="text-2xl font-bold tnum text-ink">{Math.round(pctv)}%</span>}
        {sublabel && <span className="text-[11px] font-medium text-subtle mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "var(--color-primary)",
  fill = true,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  className?: string;
}) {
  if (data.length < 2) return <div style={{ width, height }} className={className} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((d - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const id = `spark-${color.replace(/\W/g, "")}`;
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Horizontal stat bars (e.g., aging buckets) ───────────────────────────────
export function BarRow({
  label,
  value,
  max,
  color = "var(--color-primary)",
  caption,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  caption?: string;
}) {
  const w = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 text-xs font-medium text-muted tnum">{label}</span>
      <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-[#f1f2f8]">
        <div
          className="h-full rounded-md"
          style={{ width: `${w}%`, background: color, transition: "width 600ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </div>
      {caption && <span className="w-20 shrink-0 text-right text-xs font-semibold tnum text-ink">{caption}</span>}
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({
  value,
  color = "var(--color-primary)",
  className,
  height = 8,
}: {
  value: number;
  color?: string;
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-[#eceef6]", className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color, transition: "width 600ms cubic-bezier(0.22,1,0.36,1)" }}
      />
    </div>
  );
}

// ── Multi-point trend line with axis baseline ────────────────────────────────
export function TrendLine({
  data,
  labels,
  width = 520,
  height = 180,
  color = "var(--color-success)",
  className,
}: {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  const padX = 28;
  const padY = 20;
  const max = 100;
  const min = Math.max(0, Math.min(...data) - 10);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (d - min) / span) * (height - padY * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const id = `trend-${color.replace(/\W/g, "")}`;
  const gridY = [0, 25, 50, 75, 100];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("w-full", className)} role="img" aria-label={`Trend ending at ${data[data.length - 1]}%`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((g) => {
        const y = padY + (1 - (g - min) / span) * (height - padY * 2);
        if (g < min) return null;
        return (
          <g key={g}>
            <line x1={padX} y1={y} x2={width - padX} y2={y} className="grid-hairline" />
            <text x={4} y={y + 3} className="fill-faint text-[9px]">{g}</text>
          </g>
        );
      })}
      <path d={`${line} L${pts[pts.length - 1][0]},${height - padY} L${pts[0][0]},${height - padY} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={3.5} fill="white" stroke={color} strokeWidth={2} />
          {labels?.[i] && (
            <text x={x} y={height - 5} textAnchor="middle" className="fill-subtle text-[9px] font-medium">
              {labels[i]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
