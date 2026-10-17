import { useState } from "react";

import type { Reading } from "@/hooks/use-reservoir-sim";
import { fmtTime } from "@/hooks/use-reservoir-sim";

// Llenado del bordo con y sin infraestructura verde, con la misma lluvia.
// Las dos series están en % de llenado, así que comparten eje.

type Period = "Últimos 30 min" | "Última hora" | "Últimas 2 horas";
const PERIODS: { label: Period; minutes: number }[] = [
  { label: "Últimos 30 min", minutes: 30 },
  { label: "Última hora", minutes: 60 },
  { label: "Últimas 2 horas", minutes: 120 },
];
const POINTS = 12;

const C_ACTUAL = "#4cb6d9";
const C_VERDE = "#55c084";

const W = 800;
const H = 340;
const PAD = 60;
const CHART_W = W - PAD * 2;
const CHART_H = H - PAD * 2;
const MAX = 105;

const xAt = (i: number, n: number) => PAD + (i / Math.max(1, n - 1)) * CHART_W;
const yAt = (v: number) => PAD + (1 - v / MAX) * CHART_H;

// Curva suave entre puntos (Bézier cúbica con puntos de control horizontales)
function smoothPath(values: number[], area = false) {
  if (values.length < 2) return "";
  const pts = values.map((v, i) => ({ x: xAt(i, values.length), y: yAt(v) }));
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const cp1x = prev.x + (curr.x - prev.x) * 0.5;
    const cp2x = curr.x - (next ? (next.x - curr.x) * 0.3 : 0);
    d += ` C ${cp1x},${prev.y} ${cp2x},${curr.y} ${curr.x},${curr.y}`;
  }
  if (area) d += ` L ${pts[pts.length - 1].x},${H - PAD} L ${PAD},${H - PAD} Z`;
  return d;
}

interface Props {
  hist: Reading[];
  retainedM3: number;
  captureLabel: string;
}

export default function GreenInfraChart({ hist, retainedM3, captureLabel }: Props) {
  const [period, setPeriod] = useState<Period>("Última hora");
  const [hovered, setHovered] = useState<number | null>(null);

  const minutes = PERIODS.find((p) => p.label === period)!.minutes;
  const slice = hist.slice(-minutes);
  const stepN = Math.max(1, Math.floor(slice.length / (POINTS - 1)));
  const sampled = slice.filter((_, i) => i % stepN === 0 || i === slice.length - 1).slice(-POINTS);
  const dates = sampled.map((d) => fmtTime(d.t));
  const actual = sampled.map((d) => Math.min(d.p, 104));
  const verde = sampled.map((d) => Math.min(d.pg, 104));
  const n = dates.length;

  const peakActual = Math.max(...slice.map((d) => Math.min(d.p, 104)));
  const peakVerde = Math.max(...slice.map((d) => Math.min(d.pg, 104)));
  const reduction = peakActual - peakVerde;

  const metrics = [
    { label: "Pico actual", value: `${peakActual.toFixed(0)}%`, color: "border-agua" },
    { label: "Pico con infraestructura verde", value: `${peakVerde.toFixed(0)}%`, color: "border-ok" },
    { label: "Reducción del pico", value: `${reduction >= 0 ? "−" : "+"}${Math.abs(reduction).toFixed(0)} pts`, color: "border-serious" },
  ];

  const tipX = hovered !== null ? Math.min(Math.max(xAt(hovered, n), 84), W - 84) : 0;

  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">¿Cuánto ayuda la infraestructura verde?</h2>
        <p className="max-w-[70ch] text-muted-foreground">
          Llenado del mismo bordo con la misma lluvia, con y sin {captureLabel}. Es una estimación del modelo para dimensionar las obras; las
          mediciones del piloto la confirmarán.
        </p>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-0">
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-5" style={{ background: C_ACTUAL }} />
              <span className="text-muted-foreground">Situación actual</span>
              <span className="font-semibold tabular-nums">{actual[n - 1]?.toFixed(0)}%</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 border-t-2 border-dashed" style={{ borderColor: C_VERDE }} />
              <span className="text-muted-foreground">Con infraestructura verde</span>
              <span className="font-semibold tabular-nums">{verde[n - 1]?.toFixed(0)}%</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Periodo">
            {PERIODS.map((p) => (
              <button
                type="button"
                key={p.label}
                aria-pressed={period === p.label}
                onClick={() => setPeriod(p.label)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors ${
                  period === p.label ? "bg-foreground text-background" : "border text-muted-foreground hover:bg-accent"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto px-2 pb-4 pt-2 sm:px-6">
          <div className="relative h-80 min-w-[560px]">
            <svg className="h-full w-full" viewBox="0 0 800 380" role="img" aria-label="Llenado con y sin infraestructura verde">
              {[
                { v: 60, c: "#e2b53a" },
                { v: 80, c: "#f08a43" },
                { v: 90, c: "#f0625a" },
              ].map((t) => (
                <g key={t.v}>
                  <line x1={PAD} x2={W - PAD} y1={yAt(t.v)} y2={yAt(t.v)} stroke={t.c} strokeDasharray="5 5" strokeOpacity={0.6} />
                  <text x={W - PAD + 6} y={yAt(t.v) + 4} fill={t.c} fontSize="11">
                    {t.v}%
                  </text>
                </g>
              ))}
              {[0, 50, 100].map((v) => (
                <text key={v} x={PAD - 10} y={yAt(v) + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="11">
                  {v}%
                </text>
              ))}

              <path d={smoothPath(actual, true)} fill="rgba(76,182,217,0.10)" />
              <path d={smoothPath(verde, true)} fill="rgba(85,192,132,0.10)" />
              <path d={smoothPath(actual)} fill="none" stroke={C_ACTUAL} strokeWidth="2.5" strokeLinecap="round" />
              <path d={smoothPath(verde)} fill="none" stroke={C_VERDE} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="7 5" />

              {dates.map((_, i) => (
                <g key={i}>
                  <rect
                    x={xAt(i, n) - CHART_W / (POINTS * 2)}
                    y={PAD}
                    width={CHART_W / POINTS}
                    height={CHART_H}
                    fill="transparent"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  <circle cx={xAt(i, n)} cy={yAt(verde[i])} r={hovered === i ? 5 : 3} fill={C_VERDE} pointerEvents="none" />
                  <circle cx={xAt(i, n)} cy={yAt(actual[i])} r={hovered === i ? 5 : 3} fill={C_ACTUAL} pointerEvents="none" />
                </g>
              ))}

              {dates.map((date, i) =>
                i % 2 === 0 || i === n - 1 ? (
                  <text key={i} x={xAt(i, n)} y={312} textAnchor="middle" fill="var(--muted-foreground)" fontSize="12">
                    {date}
                  </text>
                ) : null,
              )}

              {hovered !== null && dates[hovered] && (
                <g pointerEvents="none">
                  <line x1={xAt(hovered, n)} x2={xAt(hovered, n)} y1={PAD} y2={PAD + CHART_H} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
                  <rect x={tipX - 80} y={8} width="160" height="66" fill="var(--card)" stroke="var(--border)" rx="6" />
                  <text x={tipX} y={28} textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="600">
                    {dates[hovered]}
                  </text>
                  <text x={tipX} y={46} textAnchor="middle" fill={C_ACTUAL} fontSize="11">
                    Actual: {actual[hovered].toFixed(0)}%
                  </text>
                  <text x={tipX} y={63} textAnchor="middle" fill={C_VERDE} fontSize="11">
                    Con infra. verde: {verde[hovered].toFixed(0)}%
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
          <div className="flex flex-wrap gap-3">
            {metrics.map((m) => (
              <div key={m.label} className={`min-w-[150px] rounded-lg border-l-4 bg-background p-4 ${m.color}`}>
                <div className="mb-1 font-display text-2xl font-bold tabular-nums">{m.value}</div>
                <div className="text-sm text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border bg-background px-5 py-3">
            <p className="text-sm text-muted-foreground">Agua retenida en origen (24 h)</p>
            <p className="font-display text-2xl font-bold tabular-nums">{Math.round(retainedM3).toLocaleString("es-MX")} m³</p>
          </div>
        </div>
      </div>
    </div>
  );
}
