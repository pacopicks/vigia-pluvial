import { CFG, LEVELS, type Reading } from "@/hooks/use-reservoir-sim";

const MARKS = [
  { p: 60, color: LEVELS[1].color },
  { p: 80, color: LEVELS[2].color },
  { p: 90, color: LEVELS[3].color },
];

// Corte del vaso con regla graduada en cm, como la escala que se instala junto al sensor
export function Tank({ last }: { last: Reading }) {
  const over = last.L >= CFG.NIVEL_MAX;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        <div className="relative h-[280px] w-9 font-mono text-[10px] text-muted-foreground" aria-hidden>
          {[0, 50, 100, 150, 200, 250].map((c) => (
            <span key={c} className="absolute right-0 flex translate-y-1/2 items-center gap-1" style={{ bottom: `${(c / 250) * 100}%` }}>
              {c}
              <i className="inline-block h-px w-1.5 bg-muted-foreground" />
            </span>
          ))}
        </div>
        <div
          className="relative h-[280px] w-40 overflow-hidden rounded-b-2xl border-2 border-t-0 border-muted-foreground/60 bg-muted/40"
          role="img"
          aria-label={`Reservorio al ${Math.min(last.p, 100).toFixed(0)}%`}
        >
          <div
            className="water-wave absolute inset-x-0 bottom-0 bg-gradient-to-b from-agua to-agua-2 transition-[height] duration-700"
            style={{ height: `${Math.min(last.p, 100)}%` }}
          />
          {/* Azolve acumulado en el fondo */}
          <div
            className="absolute inset-x-0 bottom-0 opacity-90"
            style={{
              height: `${CFG.SILT_PCT * 0.35}%`,
              background: "repeating-linear-gradient(135deg,#7d6243 0 3px,#9a7d58 3px 7px)",
            }}
          />
          {MARKS.map((m) => (
            <div key={m.p} className="absolute inset-x-0 border-t-[1.5px] border-dashed" style={{ bottom: `${m.p}%`, borderColor: m.color }}>
              <span
                className="absolute -top-4 right-1 rounded border bg-card px-1 font-mono text-[10px]"
                style={{ borderColor: m.color }}
              >
                {m.p}%
              </span>
            </div>
          ))}
          {over && (
            <div className="absolute inset-0 grid place-items-center bg-crit/50 font-display font-extrabold tracking-widest text-white">
              DESBORDE
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="font-display text-4xl font-extrabold tabular-nums">{Math.min(last.p, 100).toFixed(0)}%</p>
        <p className="text-xs text-muted-foreground">
          {last.L.toFixed(0)} cm de {CFG.NIVEL_MAX} cm (desborde) · azolve en el fondo
        </p>
      </div>
    </div>
  );
}
