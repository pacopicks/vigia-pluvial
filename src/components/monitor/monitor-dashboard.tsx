import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { Bell, CloudRain, Droplets, Map as MapIcon, Pause, Play, Send, TrendingUp, Waves } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  caseContext,
  levelChartConfig,
  rainChartConfig,
  monitorSections,
} from "@/components/monitor/monitor-data";
import { MonitorSidebar } from "@/components/monitor/monitor-sidebar";

import { AlertToasts, StatusAlert } from "@/components/monitor/status-alert";
import { Tank } from "@/components/monitor/tank";
import { ReservoirMap } from "@/components/monitor/reservoir-map";
import { EnvironmentCard } from "@/components/monitor/environment-card";
import { DrillPanel } from "@/components/monitor/drill-panel";
import { CitizenAlertComposer } from "@/components/monitor/citizen-alert-composer";
import GreenInfraChart from "@/components/charts/green-infra-chart";
import { CFG, fmtTime, LEVELS, SCENARIOS, type Sim } from "@/hooks/use-reservoir-sim";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/auth";

function useActiveSection() {
  const [active, setActive] = useState(monitorSections[0].id);
  useEffect(() => {
    const onScroll = () => {
      let current = monitorSections[0].id;
      for (const s of monitorSections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < 140) current = s.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return active;
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "VP";

export function MonitorDashboard({ sim, user, onSignOut }: { sim: Sim; user: Session; onSignOut: () => void }) {
  const active = useActiveSection();

  // "#/monitor/simulacro" abre directamente en esa sección
  useEffect(() => {
    const id = window.location.hash.split("/")[2];
    if (id) window.setTimeout(() => scrollTo(id), 150);
  }, []);
  const { last, rate, lvl, hist } = sim;

  const rtLabel = rate >= CFG.RAPID ? "Ascenso rápido" : rate > 0.2 ? "Subiendo" : rate < -0.2 ? "Bajando" : "Estable";
  const turbLabel = last.turb > 100 ? "Arrastre fuerte" : last.turb > 50 ? "Arrastre de sedimento" : last.turb > 25 ? "Arrastre leve" : "Agua clara";

  const STATS = [
    { label: "Llenado del bordo", value: `${Math.min(last.p, 100).toFixed(0)}%`, hint: `${last.L.toFixed(0)} cm de ${CFG.NIVEL_MAX} cm`, icon: Waves },
    { label: "Tasa de ascenso", value: `${rate >= 0 ? "+" : ""}${rate.toFixed(2)}`, unit: "cm/min", hint: `${rtLabel} · rápido desde ${CFG.RAPID} cm/min`, icon: TrendingUp },
    { label: "Lluvia ahora", value: last.r.toFixed(1), unit: "mm/h", hint: `Última hora ${sim.rain1h.toFixed(1)} mm · 24 h ${sim.rain24h.toFixed(1)} mm`, icon: CloudRain },
    { label: "Turbidez en la entrada", value: last.turb.toFixed(0), unit: "NTU", hint: turbLabel, icon: Droplets },
  ];

  const chartData = hist.map((d) => ({
    hora: fmtTime(d.t),
    llenado: Math.round(Math.min(d.p, 104) * 10) / 10,
    lluvia: Math.round(d.r * 10) / 10,
  }));
  const rainVsRecord = Math.min(100, (sim.rain24h / CFG.RECORD_MM) * 100);

  return (
    <SidebarProvider>
      <MonitorSidebar
        active={active}
        lvl={lvl}
        alertCount={sim.log.filter((l) => !l.test).length}
        user={{ name: user.name, role: user.role, initials: initialsOf(user.name) }}
        onSignOut={onSignOut}
      />
      {/*
        min-w-0: the inset is a flex item, and a flex item's min-width is `auto`, so it
        refuses to shrink below the min-content width of the widest thing inside it.
      */}
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-[1001] flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger aria-label="Mostrar u ocultar navegación" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">Monitor del bordo · cuenca de Peñuelas</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Lectura de las {fmtTime(sim.now)} · datos simulados para demostración
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground md:flex">
              <span className={cn("size-2 rounded-full", sim.paused ? "bg-muted-foreground" : "animate-pulse bg-ok")} />
              {sim.paused ? "En pausa" : "En vivo"}
            </span>
            {sim.drill && (
              <button
                type="button"
                onClick={() => scrollTo("simulacro")}
                className="mr-2 hidden cursor-pointer items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-2.5 py-1 text-xs text-primary sm:flex"
              >
                {sim.drill.done ? "Simulacro terminado" : `Simulacro · min ${sim.drill.elapsed}`}
              </button>
            )}
            <Button variant="ghost" size="icon" aria-label="Ir al mapa" onClick={() => scrollTo("mapa")}>
              <MapIcon />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Ver alertas" className="relative" onClick={() => scrollTo("bitacora")}>
              <Bell />
              {lvl > 0 && <span className="absolute right-2 top-2 size-2 rounded-full" style={{ background: LEVELS[lvl].color }} />}
            </Button>
            <Avatar className="ml-1 size-8">
              <AvatarFallback className="bg-agua/15 text-xs font-semibold text-agua" title={`${user.name} · ${user.role}`}>
                {initialsOf(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          {/* Resumen */}
          <section id="resumen" className="flex scroll-mt-20 flex-col gap-4">
            <StatusAlert lvl={lvl} last={last} rate={rate} />

            <Card>
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
                <span className="text-xs font-medium text-muted-foreground">Escenario de lluvia</span>
                <div className="flex flex-wrap gap-1.5">
                  {SCENARIOS.map((s) => (
                    <Button
                      key={s.id}
                      size="sm"
                      variant={sim.scenario === s.id ? "default" : "outline"}
                      aria-pressed={sim.scenario === s.id}
                      onClick={() => sim.setScenario(s.id)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
                <span className="text-xs font-medium text-muted-foreground">Velocidad</span>
                <div className="flex gap-1.5">
                  {[1, 5].map((v) => (
                    <Button key={v} size="sm" variant={sim.speed === v ? "secondary" : "ghost"} aria-pressed={sim.speed === v} onClick={() => sim.setSpeed(v)}>
                      {v} min/s
                    </Button>
                  ))}
                </div>
                <div className="ml-auto flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={sim.togglePause}>
                    {sim.paused ? <Play /> : <Pause />}
                    {sim.paused ? "Reanudar" : "Pausar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={sim.sendTest}>
                    <Send />
                    Alerta de prueba
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {STATS.map((stat) => (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-sans text-sm font-medium">{stat.label}</CardTitle>
                    <stat.icon aria-hidden className="size-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-3xl font-bold tabular-nums">
                      {stat.value}
                      {stat.unit && <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">{stat.unit}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.hint}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vaso del bordo</CardTitle>
                  <CardDescription>Sensor ultrasónico a {CFG.H_SENSOR} cm del fondo</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tank last={last} />
                </CardContent>
              </Card>

              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lluvia de 24 h frente a la tormenta récord</CardTitle>
                    <CardDescription>
                      En agosto de 2025 cayeron {caseContext.stormMm} mm (el récord anterior era {caseContext.prevRecordMm} mm). El canal
                      de Peñuelas se desbordó y al menos dos personas murieron arrastradas por la corriente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Progress value={rainVsRecord} aria-label="Lluvia de 24 horas frente a 146 mm" indicatorClassName={rainVsRecord > 75 ? "bg-crit" : "bg-agua"} />
                      <span className="shrink-0 font-mono text-sm tabular-nums">
                        {sim.rain24h.toFixed(1)} / {CFG.RECORD_MM} mm
                      </span>
                    </div>
                    {sim.env.recordActive && (
                      <p className="text-xs text-muted-foreground">
                        Reproduciendo el evento: {sim.env.recordMm.toFixed(0)} de {CFG.RECORD_MM} mm caídos en este escenario.
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Capacidad útil</CardTitle>
                    <CardDescription>El azolve y la basura reducen el volumen sin que se note</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Progress value={100 - CFG.SILT_PCT} aria-label="Capacidad útil" indicatorClassName="bg-agua" />
                      <span className="shrink-0 font-mono text-sm tabular-nums">{100 - CFG.SILT_PCT}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Azolve: {CFG.SILT_PCT}% del volumen original (batimetría de ejemplo). Desazolve recomendado antes de la temporada de
                      lluvias, no después del desbordamiento.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Gráficas */}
          <Card id="graficas" className="scroll-mt-20">
            <CardHeader>
              <CardTitle className="text-lg">Nivel y lluvia · últimas 2 horas</CardTitle>
              <CardDescription>Una lectura por minuto. Las líneas punteadas son los umbrales de alerta.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <ChartContainer config={levelChartConfig} className="aspect-auto h-64 w-full">
                <AreaChart data={chartData} margin={{ left: 4, right: 12, top: 8 }} accessibilityLayer>
                  <defs>
                    <linearGradient id="llenadoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-llenado)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-llenado)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="hora" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} />
                  <YAxis tickLine={false} axisLine={false} width={40} domain={[0, 105]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} />
                  {[1, 2, 3].map((i) => (
                    <ReferenceLine
                      key={i}
                      y={[0, 60, 80, 90][i]}
                      stroke={LEVELS[i].color}
                      strokeDasharray="5 4"
                      label={{ value: `${[0, 60, 80, 90][i]}% ${LEVELS[i].name.toLowerCase()}`, position: "insideTopLeft", fill: LEVELS[i].color, fontSize: 10 }}
                    />
                  ))}
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Area dataKey="llenado" type="monotone" stroke="var(--color-llenado)" fill="url(#llenadoGradient)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ChartContainer>
              <p className="text-xs font-medium text-muted-foreground">Intensidad de lluvia (mm/h) · pluviómetro de balancín</p>
              <ChartContainer config={rainChartConfig} className="aspect-auto h-28 w-full">
                <BarChart data={chartData} margin={{ left: 4, right: 12 }} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="hora" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="lluvia" fill="var(--color-lluvia)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Mapa */}
          <Card id="mapa" className="scroll-mt-20">
            <CardHeader>
              <CardTitle className="text-lg">Mapa de la cuenca</CardTitle>
              <CardDescription>
                Colonias aguas abajo: {caseContext.colonias.join(", ")}. Haz clic en los marcadores para ver cada nodo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReservoirMap sim={sim} />
            </CardContent>
          </Card>

          {/* Simulacro por escenario */}
          <section id="simulacro" className="scroll-mt-20">
            <DrillPanel sim={sim} />
          </section>

          {/* Alerta a la ciudadanía con pasos de contingencia */}
          <section id="ciudadania" className="scroll-mt-20">
            <CitizenAlertComposer sim={sim} />
          </section>

          {/* Daño ambiental */}
          <section id="ambiente" className="scroll-mt-20">
            <EnvironmentCard sim={sim} />
          </section>

          {/* Infraestructura verde: con y sin obras */}
          <section id="verde" className="scroll-mt-20">
            <GreenInfraChart
              hist={hist}
              retainedM3={sim.env.greenInfraM3}
              captureLabel={`infraestructura verde reteniendo el ${Math.round(CFG.GREEN_CAPTURE * 100)}% de la escorrentía`}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Nodos */}
            <Card id="nodos" className="scroll-mt-20">
              <CardHeader>
                <CardTitle className="text-lg">Nodos de campo</CardTitle>
                <CardDescription>
                  Disponibilidad de datos {sim.availability.toFixed(1)}% (meta 95%) · envío cada{" "}
                  {last.p >= 60 ? "30 s porque el llenado pasa de 60%" : "5 min"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {sim.nodes.map((n) => {
                  const low = n.batt < 25;
                  return (
                    <div key={n.id} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate font-sans text-sm font-medium">
                          {n.id} · {n.place}
                        </h3>
                        <Badge variant={low ? "destructive" : "secondary"}>{sim.paused ? "En pausa" : low ? "Batería baja" : "En línea"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{n.sensor} · LoRaWAN {n.rssi} dBm · panel solar</p>
                      <div className="flex items-center gap-3">
                        <Progress value={n.batt} aria-label={`Batería de ${n.id}`} className="h-2" indicatorClassName={low ? "bg-crit" : "bg-ok"} />
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{n.batt.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Bitácora */}
            <Card id="bitacora" className="scroll-mt-20">
              <CardHeader>
                <CardTitle className="text-lg">Bitácora de alertas</CardTitle>
                <CardDescription>Mensajes enviados por WhatsApp, SMS y Telegram</CardDescription>
              </CardHeader>
              <CardContent>
                {sim.log.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin alertas en las últimas horas.</p>
                ) : (
                  <ol className="flex max-h-[360px] flex-col gap-4 overflow-y-auto pr-1">
                    {sim.log.map((entry) => (
                      <li key={entry.id} className="flex items-start gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback
                            className="text-xs font-semibold"
                            style={{ background: `${LEVELS[entry.lvl].color}22`, color: entry.test ? "var(--color-agua)" : LEVELS[entry.lvl].color }}
                          >
                            {entry.test ? "P" : LEVELS[entry.lvl].name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug font-medium">{entry.msg}</p>
                          <p className="text-xs text-muted-foreground">
                            {fmtTime(entry.t)} · {entry.canal}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Protocolo */}
          <Card id="protocolo" className="scroll-mt-20">
            <CardHeader>
              <CardTitle className="text-lg">Protocolo de respuesta</CardTitle>
              <CardDescription>Umbrales iniciales; se ajustan con las primeras tormentas del piloto</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {LEVELS.map((l, i) => (
                <div
                  key={l.key}
                  className={cn("rounded-lg border p-4 transition-opacity", i === lvl ? "opacity-100" : "opacity-55")}
                  style={i === lvl ? { borderColor: l.color, background: `${l.color}14` } : undefined}
                >
                  <p className="font-display font-bold" style={{ color: l.color }}>
                    {l.name} · {l.rule}
                  </p>
                  <p className="mt-1 text-sm">{l.act}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Avisa a: {l.who}</p>
                  <p className="text-xs text-muted-foreground">Canal: {l.canal}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <p className="max-w-[80ch] text-xs text-muted-foreground">
            Las lecturas son simuladas con un modelo simple de entrada por escorrentía y salida por vertedor. En el piloto, este tablero lee
            los datos reales de los nodos ESP32 desde ThingsBoard o InfluxDB, y el tablero público queda abierto a vecinos, escuelas y
            autoridades.
          </p>
        </main>
      </SidebarInset>

      <AlertToasts toasts={sim.toasts} onClose={sim.dismissToast} className="bottom-20" />
    </SidebarProvider>
  );
}

export default MonitorDashboard;
