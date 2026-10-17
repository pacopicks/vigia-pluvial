import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Flag, Megaphone, Play, RotateCcw, Square, Timer } from "lucide-react";
import { composeCitizenAlert } from "@/components/monitor/citizen-alert-composer";

import PatternBarChart from "@/components/charts/pattern-bar-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ChartConfig } from "@/components/ui/chart";
import { CFG, LEVELS, SCENARIOS, type Level, type Sim } from "@/hooks/use-reservoir-sim";
import { cn } from "@/lib/utils";

const resultsConfig = {
  amarillo: { label: "Minutos hasta alerta amarilla", color: "#e2b53a" },
  rojo: { label: "Minutos hasta alerta roja", color: "#f0625a" },
} satisfies ChartConfig;

const label = (id: string) => SCENARIOS.find((s) => s.id === id)!.label;

export function DrillPanel({ sim }: { sim: Sim }) {
  const d = sim.drill;
  // Pasos marcados: clave "nivel-paso" → minuto del simulacro en que se marcó
  const [checks, setChecks] = useState<Record<string, number>>({});
  // El objeto del simulacro se crea de nuevo en cada inicio (y se muta durante la corrida)
  useEffect(() => setChecks({}), [d]);

  // Si la alerta sube de golpe (p. ej. de verde a naranja), los pasos de los niveles intermedios también aplican
  const maxLvl = d ? (Math.max(0, ...d.events.map((e) => e.lvl)) as Level) : 0;
  const reached = ([1, 2, 3] as Level[]).filter((l) => l <= maxLvl);
  const activatedAt = (lvl: Level) => d!.events.find((e) => e.lvl >= lvl)!.min;
  // Alertar a la ciudadanía aplica a los niveles que sí sonaron; uno saltado queda cubierto por el aviso del nivel superior
  const fired = new Set(d ? d.events.map((e) => e.lvl) : []);
  const coveredBy = (lvl: Level) => (fired.has(lvl) ? null : (([1, 2, 3] as Level[]).find((l) => l > lvl && fired.has(l)) ?? null));
  const citizenDone = reached.filter((l) => fired.has(l) && d?.citizen[l] !== undefined).length;
  const citizenNeeded = reached.filter((l) => fired.has(l)).length;
  const totalSteps = reached.reduce<number>((n, l) => n + LEVELS[l].steps.length + (fired.has(l) ? 1 : 0), 0);
  const doneSteps = Object.keys(checks).length + citizenDone;

  const toggle = (lvl: Level, i: number) => {
    if (!d) return;
    const k = `${lvl}-${i}`;
    setChecks((c) => {
      const n = { ...c };
      if (k in n) delete n[k];
      else n[k] = d.elapsed;
      return n;
    });
  };

  const results = SCENARIOS.filter((s) => sim.drillResults[s.id]).map((s) => ({
    escenario: s.label.replace(" · 146 mm", ""),
    amarillo: sim.drillResults[s.id]!.toYellow,
    rojo: sim.drillResults[s.id]!.toRed,
  }));

  const anticipation = d && d.overflowAt !== null && d.events.find((e) => e.lvl >= 1) ? d.overflowAt - d.events.find((e) => e.lvl >= 1)!.min : null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Simulacro por escenario</CardTitle>
          <CardDescription>
            Elige un escenario: el bordo parte al 40% (agua de lluvias previas) y la lluvia corre {CFG.DRILL_MIN} minutos simulados (2½ minutos
            reales a 1 min/s, o 30 segundos a 5 min/s). Cuando se active cada alerta, alerta a la ciudadanía y marca los pasos del protocolo conforme el comité los cumpla.
            Puedes pausar en cualquier momento. Los mensajes del simulacro no se envían a ningún teléfono.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {SCENARIOS.map((s) => {
            const r = sim.drillResults[s.id];
            const active = d?.scenario === s.id && !d.done;
            return (
              <div key={s.id} className={cn("flex flex-col gap-2 rounded-lg border p-3", active && "border-primary bg-primary/5")}>
                <p className="font-display font-semibold">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
                <p className="font-mono text-xs text-muted-foreground">{s.mmh} mm/h</p>
                {r && (
                  <p className="text-xs">
                    Pico {Math.min(r.peak, 100).toFixed(0)}% ·{" "}
                    {r.toRed !== null ? `rojo al min ${r.toRed}` : r.toYellow !== null ? `amarillo al min ${r.toYellow}` : "sin alertas"}
                    {r.toOverflow !== null && ` · desborde al min ${r.toOverflow}`}
                  </p>
                )}
                <Button size="sm" variant={active ? "secondary" : "outline"} className="mt-auto" onClick={() => sim.startDrill(s.id)}>
                  {r ? <RotateCcw /> : <Play />}
                  {active ? "Reiniciar" : r ? "Repetir" : "Simular"}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {d && (
        <Card className={cn(d.done ? "border-ok/40" : "border-primary/40")}>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {d.done ? <Flag className="size-5 text-ok" /> : <Timer className="size-5 text-primary" />}
                {d.done ? "Simulacro terminado" : "Simulacro en curso"} · {label(d.scenario)}
              </CardTitle>
              <CardDescription>
                Minuto {d.elapsed} de {d.duration} · llenado máximo {Math.min(d.peakP, 100).toFixed(0)}%
                {d.overflowAt !== null && ` · desborde al minuto ${d.overflowAt}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {d.done ? (
                <Button size="sm" variant="outline" onClick={() => sim.startDrill(d.scenario)}>
                  <RotateCcw /> Repetir
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={sim.togglePause}>
                  {sim.paused ? <Play /> : <Square />}
                  {sim.paused ? "Continuar" : "Pausar"}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={sim.stopDrill}>
                Salir del simulacro
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Progress value={(d.elapsed / d.duration) * 100} aria-label="Avance del simulacro" className="h-2" />

            {/* Línea de tiempo de alertas */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Alertas:</span>
              {d.events.length === 0 ? (
                <span className="text-muted-foreground">ninguna todavía</span>
              ) : (
                d.events.map((e, i) => (
                  <Badge key={i} variant="outline" style={{ borderColor: LEVELS[e.lvl].color, color: LEVELS[e.lvl].color }}>
                    {LEVELS[e.lvl].name} · min {e.min}
                  </Badge>
                ))
              )}
            </div>

            {/* Lista de pasos del protocolo */}
            {reached.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {reached.map((lvl) => {
                  const ev = { min: activatedAt(lvl) };
                  const citizenAt = d.citizen[lvl];
                  return (
                    <div key={lvl} className="rounded-lg border p-4" style={{ borderColor: `${LEVELS[lvl].color}66` }}>
                      <p className="font-display font-bold" style={{ color: LEVELS[lvl].color }}>
                        {LEVELS[lvl].title}
                      </p>
                      <p className="mb-3 text-xs text-muted-foreground">
                        Se activó en el minuto {ev.min} · avisa a {LEVELS[lvl].who}
                      </p>
                      <div className="mb-2 rounded-md border border-dashed px-2 py-2">
                        {coveredBy(lvl) !== null ? (
                          <p className="text-xs text-muted-foreground">
                            La alerta subió directo a {LEVELS[coveredBy(lvl)!].name.toLowerCase()}: el aviso a la ciudadanía va con ese nivel.
                          </p>
                        ) : citizenAt !== undefined ? (
                          <p className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />
                            <span className="flex-1">Alerta a la ciudadanía enviada</span>
                            <span className="font-mono text-xs text-muted-foreground">{Math.max(0, citizenAt - ev.min)} min</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => composeCitizenAlert(lvl as 1 | 2 | 3)}
                            className="flex w-full cursor-pointer items-center gap-2 text-left text-sm font-medium text-primary"
                          >
                            <Megaphone className="size-4 shrink-0" /> Alertar a la ciudadanía con pasos a seguir
                          </button>
                        )}
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {LEVELS[lvl].steps.map((stepText, i) => {
                          const k = `${lvl}-${i}`;
                          const done = k in checks;
                          return (
                            <li key={k}>
                              <button
                                type="button"
                                onClick={() => toggle(lvl, i)}
                                aria-pressed={done}
                                className="flex w-full cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-accent"
                              >
                                {done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                                <span className={cn("flex-1", done && "text-muted-foreground line-through")}>{stepText}</span>
                                {done && <span className="font-mono text-xs text-muted-foreground">{Math.max(0, checks[k] - ev.min)} min</span>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Aquí aparecerán los pasos del protocolo cuando se active la primera alerta.
              </p>
            )}

            {d.done && (
              <div className="grid gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Pasos cumplidos</p>
                  <p className="font-display text-2xl font-bold tabular-nums">
                    {doneSteps} / {totalSteps}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Anticipación (primera alerta → desborde)</p>
                  <p className="font-display text-2xl font-bold tabular-nums">
                    {anticipation !== null ? `${anticipation} min` : d.overflowAt === null ? "Sin desborde" : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Qué revisar</p>
                  <p>
                    {totalSteps === 0
                      ? "Este escenario no activó alertas: el protocolo no se puso a prueba."
                      : citizenDone < citizenNeeded
                        ? "No se alertó a la ciudadanía en todos los niveles: es el paso que más tiempo da a los vecinos."
                        : doneSteps < totalSteps
                          ? "Quedaron pasos sin cumplir: revisen quién es responsable de cada uno."
                          : "Todos los pasos se cumplieron. Repitan con un escenario más fuerte."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <PatternBarChart
        title="Qué tan rápido escala cada escenario"
        description="Minutos desde que empieza a llover hasta cada alerta. Menos minutos significa menos tiempo para reaccionar. Si una barra no aparece, esa alerta no se activó."
        badge={results.length ? { label: `${results.length} de ${SCENARIOS.length} escenarios`, variant: "info-light", icon: <Flag aria-hidden="true" /> } : undefined}
        data={results}
        xKey="escenario"
        patternKey="amarillo"
        solidKey="rojo"
        config={resultsConfig}
        unit=" min"
        emptyText="Corre al menos un simulacro para ver la comparación."
      />
    </div>
  );
}
