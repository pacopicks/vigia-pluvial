import { useCallback, useEffect, useReducer, useRef, useState } from "react";

// Modelo simple del reservorio: la lluvia llega con retraso por escorrentía y sale por el vertedor.
// En el piloto, este hook se reemplaza por lecturas reales (ThingsBoard / InfluxDB / MQTT).
export const CFG = {
  H_SENSOR: 300, // cm del sensor al fondo
  NIVEL_MAX: 250, // cm, nivel de desborde
  K_IN: 0.1,
  K_OUT: 0.012,
  HIST: 120, // minutos en pantalla
  RAPID: 2.0, // cm/min que cuentan como ascenso rápido
  SILT_PCT: 18, // % del volumen original ocupado por azolve
  // Microcuenca de aportación (valores de ejemplo: sustituir con el diagnóstico)
  CUENCA_HA: 85,
  IMPERMEABLE: 0.72,
  RECORD_MM: 146, // tormenta de agosto de 2025 en el norte de Querétaro
  RECORD_PREV_MM: 110,
  // Fracción de la escorrentía que captarían jardines de lluvia, zanjas y techos (supuesto de diseño)
  GREEN_CAPTURE: 0.2,
  DRILL_MIN: 150, // duración de un simulacro, en minutos simulados
};

export type Scenario = "seco" | "llovizna" | "moderada" | "tormenta" | "record";
export const SCENARIOS: { id: Scenario; label: string; mmh: number; desc: string }[] = [
  { id: "seco", label: "Sin lluvia", mmh: 0, desc: "El bordo se vacía poco a poco por el vertedor." },
  { id: "llovizna", label: "Llovizna", mmh: 6, desc: "Lluvia ligera y constante. No debería pasar de verde." },
  { id: "moderada", label: "Moderada", mmh: 20, desc: "Lluvia de tarde típica de temporada. Suele llegar a amarillo." },
  { id: "tormenta", label: "Tormenta", mmh: 60, desc: "Aguacero fuerte. Sube rápido y activa alertas altas." },
  // ~146 mm repartidos en unas 2 horas, como el evento de agosto de 2025
  { id: "record", label: "Ago 2025 · 146 mm", mmh: 75, desc: "Reproduce la tormenta récord que desbordó el canal de Peñuelas." },
];

export type Level = 0 | 1 | 2 | 3;
export const LEVELS = [
  {
    key: "ok",
    name: "Verde",
    title: "Operación normal",
    rule: "menos de 60%",
    act: "Sin acción. El comité revisa el tablero una vez al día.",
    resident: "Todo normal. Mantén limpias las coladeras de tu calle y no tires basura.",
    who: "Comité vecinal (resumen diario)",
    canal: "Telegram · Comité",
    color: "#55c084",
    marker: "green",
    steps: [] as string[],
  },
  {
    key: "warn",
    name: "Amarillo",
    title: "Alerta amarilla",
    rule: "60% o más",
    act: "Revisar rejillas, trampa de sedimentos y accesos. Mantenerse atentos.",
    resident: "Mantente atento al grupo de WhatsApp. Sube a lo alto documentos y objetos de valor si vives en zona baja.",
    who: "Comité vecinal",
    canal: "WhatsApp · Comité vecinal",
    color: "#e2b53a",
    marker: "gold",
    steps: [
      "Confirmar el aviso en el grupo del comité",
      "Revisar y limpiar las rejillas de entrada",
      "Revisar la trampa de sedimentos",
      "Comparar la lectura del sensor con la regla graduada",
    ],
  },
  {
    key: "serious",
    name: "Naranja",
    title: "Alerta naranja",
    rule: "80% o más, o 40% subiendo rápido",
    act: "Avisar a Protección Civil. Preparar evacuación preventiva de zonas bajas.",
    resident: "Prepara tu mochila de emergencia, mueve el auto a una calle alta y ubica la ruta al punto de reunión.",
    who: "Comité + Protección Civil",
    canal: "WhatsApp + SMS · Comité y Protección Civil",
    color: "#f08a43",
    marker: "orange",
    steps: [
      "Avisar a Protección Civil",
      "Avisar casa por casa en las calles bajas",
      "Abrir y preparar el punto de reunión",
      "Pedir a los vecinos que muevan autos y objetos de valor",
    ],
  },
  {
    key: "crit",
    name: "Rojo",
    title: "Alerta roja",
    rule: "90% o más, o 60% subiendo rápido",
    act: "Activar protocolo de emergencia. Evacuar zonas bajas hacia el punto de reunión.",
    resident: "Sal de las zonas bajas por la ruta marcada. No cruces calles con corriente. Si alguien está en peligro, llama al 911.",
    who: "Protección Civil, municipio y comité",
    canal: "SMS + llamada · Protección Civil, municipio, comité",
    color: "#f0625a",
    marker: "red",
    steps: [
      "Activar el protocolo de emergencia",
      "Evacuar las zonas bajas por la ruta marcada",
      "Cerrar el paso en calles con corriente",
      "Pasar lista en el punto de reunión",
      "Llamar al 911 si hay personas en riesgo",
    ],
  },
] as const;
const THR = [0, 60, 80, 90];

export interface Reading {
  t: number;
  L: number; // cm
  p: number; // % de llenado
  pg: number; // % de llenado estimado con infraestructura verde
  r: number; // mm/h
  turb: number; // NTU
}
export interface LogEntry {
  id: number;
  t: number;
  lvl: Level;
  msg: string;
  canal: string;
  test?: boolean;
}
export interface FieldNode {
  id: string;
  place: string;
  sensor: string;
  batt: number;
  rssi: number;
  position: [number, number];
}
export interface DrillEvent {
  lvl: Level;
  min: number; // minuto del simulacro en que se activó
}
export interface Drill {
  scenario: Scenario;
  elapsed: number;
  duration: number;
  events: DrillEvent[];
  peakP: number;
  overflowAt: number | null;
  done: boolean;
  notified: boolean;
  citizen: Partial<Record<Level, number>>; // minuto en que se alertó a la ciudadanía por cada nivel
}

// Alerta emitida a la ciudadanía (ver src/lib/citizen-alert.ts para el formato)
export interface CitizenAlert {
  id: number;
  t: number;
  lvl: Level;
  exercise: boolean;
  headline: string;
  description: string;
  steps: string[];
  areas: string[];
  channels: string[];
  text: string;
}
export interface DrillResult {
  toYellow: number | null;
  toOrange: number | null;
  toRed: number | null;
  toOverflow: number | null;
  peak: number;
}

interface SimState {
  t: number;
  L: number;
  Lg: number;
  r: number;
  q: number;
  turb: number;
  hist: Reading[];
  rainDay: number[];
  log: LogEntry[];
  lvl: Level;
  scenario: Scenario;
  nodes: FieldNode[];
  okReads: number;
  totReads: number;
  seq: number;
  sedimentKg: number; // sedimento arrastrado hacia el reservorio (estimado, últimas 24 h)
  overflowMin: number; // minutos con desborde hacia el canal
  wetMin: number; // minutos seguidos con agua estancada sobre el fondo
  recordMm: number; // lluvia acumulada desde que inició el escenario récord
  drill: Drill | null;
  drillResults: Partial<Record<Scenario, DrillResult>>;
  citizenAlerts: CitizenAlert[];
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pctOf = (L: number) => (L / CFG.NIVEL_MAX) * 100;

export function rateOf(hist: Reading[]) {
  const n = hist.length;
  if (n < 6) return 0;
  return (hist[n - 1].L - hist[n - 6].L) / 5;
}

// El ascenso rápido sube un escalón la alerta, pero no salta de verde a rojo con el bordo casi vacío
function rawLevel(p: number, rt: number): Level {
  const rapid = rt >= CFG.RAPID;
  if (p >= 90 || (rapid && p >= 60)) return 3;
  if (p >= 80 || (rapid && p >= 40)) return 2;
  if (p >= 60) return 1;
  return 0;
}

function addLog(s: SimState, e: Omit<LogEntry, "id">) {
  const entry = { ...e, id: ++s.seq };
  s.log.unshift(entry);
  if (s.log.length > 40) s.log.length = 40;
  return entry;
}

function finishDrill(s: SimState) {
  const d = s.drill!;
  d.done = true;
  const first = (lvl: Level) => d.events.find((e) => e.lvl >= lvl)?.min ?? null;
  s.drillResults[d.scenario] = {
    toYellow: first(1),
    toOrange: first(2),
    toRed: first(3),
    toOverflow: d.overflowAt,
    peak: d.peakP,
  };
}

function step(s: SimState): LogEntry | null {
  let target = SCENARIOS.find((x) => x.id === s.scenario)!.mmh;
  if (s.scenario === "record") {
    // Se detiene al llegar a los 146 mm del evento real
    s.recordMm += s.r / 60;
    if (s.recordMm >= CFG.RECORD_MM) target = 0;
  }
  s.r = Math.max(0, s.r + (target - s.r) * 0.15 + (Math.random() - 0.5) * target * 0.5);
  s.q += (s.r - s.q) * 0.2;
  s.L = clamp(s.L + s.q * CFG.K_IN - CFG.K_OUT * s.L, 0, 262);
  // Mismo bordo, pero con infraestructura verde captando parte de la escorrentía en origen
  s.Lg = clamp(s.Lg + s.q * CFG.K_IN * (1 - CFG.GREEN_CAPTURE) - CFG.K_OUT * s.Lg, 0, 262);
  s.turb += (12 + s.q * 2.4 - s.turb) * 0.25 + (Math.random() - 0.5) * 1.5;
  s.t += 60000;

  // Lectura del sensor ultrasónico: nivel = altura de instalación - distancia medida
  const d = CFG.H_SENSOR - s.L + (Math.random() - 0.5) * 0.8;
  const L = Math.max(0, CFG.H_SENSOR - d);
  s.totReads++;
  if (Math.random() > 0.004) s.okReads++;
  s.hist.push({ t: s.t, L, p: pctOf(L), pg: pctOf(s.Lg), r: s.r, turb: Math.max(0, s.turb) });
  if (s.hist.length > CFG.HIST) s.hist.shift();
  s.rainDay.push(s.r / 60);
  if (s.rainDay.length > 1440) s.rainDay.shift();

  // Acumulados ambientales (estimaciones gruesas para ilustrar el impacto)
  s.sedimentKg = s.sedimentKg * (1 - 1 / 1440) + Math.max(0, s.turb - 12) * s.q * 0.9;
  s.overflowMin = L >= CFG.NIVEL_MAX ? s.overflowMin + 1 : s.overflowMin;
  s.wetMin = L > 15 ? s.wetMin + 1 : 0;

  const hour = new Date(s.t).getHours();
  const sun = hour >= 7 && hour < 18;
  s.nodes.forEach((n, i) => {
    n.batt = clamp(n.batt + (sun ? 0.04 : -0.03) + (i === 1 ? -0.01 : 0), 5, 100);
    n.rssi = clamp(Math.round(n.rssi + (Math.random() - 0.5) * 3), -115, -80);
  });

  const p = pctOf(L);
  const dr = s.drill && !s.drill.done ? s.drill : null;
  if (dr) {
    dr.elapsed++;
    dr.peakP = Math.max(dr.peakP, p);
    if (L >= CFG.NIVEL_MAX && dr.overflowAt === null) dr.overflowAt = dr.elapsed;
  }

  const rt = rateOf(s.hist);
  const raw = rawLevel(p, rt);
  let next = s.lvl;
  if (raw > s.lvl) next = raw;
  else if (raw < s.lvl && p < THR[s.lvl] - 3 && rt < 1) next = raw;

  let entry: LogEntry | null = null;
  if (next !== s.lvl) {
    const up = next > s.lvl;
    const why = next === 3 && p < 90 ? ` por ascenso rápido (${rt.toFixed(1)} cm/min)` : ` · llenado ${p.toFixed(0)}%`;
    s.lvl = next;
    if (dr && up) dr.events.push({ lvl: next, min: dr.elapsed });
    entry = addLog(s, {
      t: s.t,
      lvl: next,
      msg: up ? `${LEVELS[next].title} enviada${why}` : `Baja a nivel ${LEVELS[next].name.toLowerCase()} · llenado ${p.toFixed(0)}%`,
      canal: up ? LEVELS[next].canal : LEVELS[1].canal,
    });
  }
  if (dr && dr.elapsed >= dr.duration) finishDrill(s);
  return entry;
}

function createSim(): SimState {
  const s: SimState = {
    t: Date.now() - CFG.HIST * 60000,
    L: 90,
    Lg: 90,
    r: 0,
    q: 0,
    turb: 14,
    hist: [],
    rainDay: [],
    log: [],
    lvl: 0,
    scenario: "seco",
    // Posiciones aproximadas en el norte de Querétaro para la demostración:
    // sustituirlas por las coordenadas reales del bordo del piloto.
    nodes: [
      { id: "N1", place: "Vertedor del bordo", sensor: "Nivel ultrasónico JSN-SR04T", batt: 86, rssi: -94, position: [20.6444, -100.409] },
      { id: "N2", place: "Entrada (trampa de sedimentos)", sensor: "Turbidez", batt: 72, rssi: -101, position: [20.6459, -100.4116] },
      { id: "N3", place: "Azotea de escuela", sensor: "Pluviómetro de balancín", batt: 91, rssi: -88, position: [20.6482, -100.4073] },
    ],
    okReads: 0,
    totReads: 0,
    seq: 0,
    sedimentKg: 0,
    overflowMin: 0,
    wetMin: 0,
    recordMm: 0,
    drill: null,
    drillResults: {},
    citizenAlerts: [],
  };
  // Historial previo: rato seco, un chubasco fuerte y luego lluvia moderada
  const plan: [Scenario, number][] = [
    ["seco", 20],
    ["tormenta", 22],
    ["moderada", CFG.HIST - 42],
  ];
  for (const [sc, k] of plan) {
    s.scenario = sc;
    for (let i = 0; i < k; i++) step(s);
  }
  s.scenario = "moderada";
  return s;
}

export function useReservoirSim() {
  const simRef = useRef<SimState | null>(null);
  if (!simRef.current) simRef.current = createSim();
  const s = simRef.current;

  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [toasts, setToasts] = useState<LogEntry[]>([]);

  const dismissToast = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const pushToast = useCallback(
    (e: LogEntry) => {
      setToasts((ts) => [e, ...ts].slice(0, 3));
      window.setTimeout(() => dismissToast(e.id), 15000);
    },
    [dismissToast],
  );

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      for (let i = 0; i < speed; i++) {
        const e = step(s);
        if (e) pushToast(e);
        if (s.drill?.done) break;
      }
      // Al terminar un simulacro se pausa para revisar el protocolo con calma
      if (s.drill?.done && !s.drill.notified) {
        s.drill.notified = true;
        setPaused(true);
      }
      rerender();
    }, 1000);
    return () => window.clearInterval(id);
  }, [paused, speed, s, pushToast]);

  const setScenario = useCallback(
    (sc: Scenario) => {
      s.scenario = sc;
      s.recordMm = 0;
      rerender();
    },
    [s],
  );

  const sendTest = useCallback(() => {
    const e = addLog(s, {
      t: s.t,
      lvl: 0,
      msg: "Mensaje de prueba enviado a todos los responsables",
      canal: "WhatsApp + SMS · 6 de 6 recibidos",
      test: true,
    });
    pushToast(e);
    rerender();
  }, [s, pushToast]);

  // Simulacro: el bordo parte al 40% (agua de lluvias previas) y corre el escenario elegido 150 minutos simulados
  const startDrill = useCallback(
    (sc: Scenario) => {
      s.L = CFG.NIVEL_MAX * 0.4;
      s.Lg = CFG.NIVEL_MAX * 0.4;
      s.r = 0;
      s.q = 0;
      s.turb = 14;
      s.lvl = 0;
      s.drill = null;
      s.scenario = "seco";
      s.hist = [];
      for (let i = 0; i < CFG.HIST; i++) step(s);
      s.scenario = sc;
      s.recordMm = 0;
      s.wetMin = 0;
      s.drill = {
        scenario: sc,
        elapsed: 0,
        duration: CFG.DRILL_MIN,
        events: [],
        peakP: pctOf(s.L),
        overflowAt: null,
        done: false,
        notified: false,
        citizen: {},
      };
      addLog(s, {
        t: s.t,
        lvl: 0,
        msg: `Simulacro iniciado · ${SCENARIOS.find((x) => x.id === sc)!.label}`,
        canal: "Ejercicio · sin envío real",
        test: true,
      });
      setToasts([]);
      setPaused(false);
      rerender();
    },
    [s],
  );

  const stopDrill = useCallback(() => {
    s.drill = null;
    rerender();
  }, [s]);

  // Emite una alerta a la ciudadanía. En el piloto, aquí se llamaría al servidor que reparte el mensaje
  // por WhatsApp (plantilla aprobada), SMS y Telegram; en esta demostración solo se registra.
  const broadcastCitizen = useCallback(
    (a: Omit<CitizenAlert, "id" | "t">) => {
      const alert: CitizenAlert = { ...a, id: ++s.seq, t: s.t };
      s.citizenAlerts.unshift(alert);
      if (s.citizenAlerts.length > 20) s.citizenAlerts.length = 20;
      if (s.drill && !s.drill.done && s.drill.citizen[a.lvl] === undefined) s.drill.citizen[a.lvl] = s.drill.elapsed;
      const e = addLog(s, {
        t: s.t,
        lvl: a.lvl,
        msg: `${a.exercise ? "[Simulacro] " : ""}Alerta a la ciudadanía: ${a.headline}`,
        canal: a.channels.join(" · "),
        test: a.exercise,
      });
      pushToast(e);
      rerender();
      return alert;
    },
    [s, pushToast],
  );

  const last = s.hist[s.hist.length - 1];
  return {
    hist: s.hist,
    last,
    rate: rateOf(s.hist),
    lvl: s.lvl,
    log: s.log,
    nodes: s.nodes,
    now: s.t,
    scenario: s.scenario,
    rain1h: s.hist.slice(-60).reduce((acc, x) => acc + x.r / 60, 0),
    rain24h: s.rainDay.reduce((acc, x) => acc + x, 0),
    availability: s.totReads ? (s.okReads / s.totReads) * 100 : 100,
    env: environment(s),
    drill: s.drill,
    drillResults: s.drillResults,
    citizenAlerts: s.citizenAlerts,
    broadcastCitizen,
    speed,
    paused,
    toasts,
    setScenario,
    setSpeed,
    togglePause: () => setPaused((p) => !p),
    sendTest,
    dismissToast,
    startDrill,
    stopDrill,
  };
}

export type Sim = ReturnType<typeof useReservoirSim>;

export type Risk = "bajo" | "medio" | "alto";

// Daño ambiental derivado de las lecturas. Son estimaciones de orden de magnitud con
// coeficientes de ejemplo; en el piloto se calibran con muestras de laboratorio y batimetría.
function environment(s: SimState) {
  const last = s.hist[s.hist.length - 1];
  const rain24 = s.rainDay.reduce((a, x) => a + x, 0);
  const areaM2 = CFG.CUENCA_HA * 10000;
  // Agua de lluvia que cayó sobre superficie impermeable y no recargó el acuífero
  const lostRechargeM3 = (rain24 / 1000) * areaM2 * CFG.IMPERMEABLE * 0.9;
  // Lo que se quedaría en origen si la infraestructura verde captara su parte de la escorrentía
  const greenInfraM3 = lostRechargeM3 * CFG.GREEN_CAPTURE;
  const p = last.p;
  const turb = last.turb;
  const sewage: Risk = last.L >= CFG.NIVEL_MAX || p >= 90 ? "alto" : p >= 80 ? "medio" : "bajo";
  const erosion: Risk = turb > 100 ? "alto" : turb > 50 ? "medio" : "bajo";
  const wetHours = s.wetMin / 60;
  const mosquito: Risk = wetHours >= 48 ? "alto" : wetHours >= 24 ? "medio" : "bajo";
  return {
    rain24,
    lostRechargeM3,
    greenInfraM3,
    sedimentT: s.sedimentKg / 1000,
    overflowMin: s.overflowMin,
    wetHours,
    sewage,
    erosion,
    mosquito,
    recordMm: s.recordMm,
    recordActive: s.scenario === "record",
  };
}

export const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

export function forecast(last: Reading, rate: number) {
  if (last.L >= CFG.NIVEL_MAX) return { label: "Estado", value: "Desbordando", sub: "activar evacuación" };
  if (rate > 0.05) {
    const to90 = (CFG.NIVEL_MAX * 0.9 - last.L) / rate;
    const toMax = (CFG.NIVEL_MAX - last.L) / rate;
    if (to90 > 600) return { label: "Pronóstico", value: "Sin riesgo", sub: `sube ${rate.toFixed(2)} cm/min` };
    if (to90 > 0) return { label: "Llega a 90% en", value: `~${Math.round(to90)} min`, sub: `desborde en ~${Math.round(toMax)} min` };
    return { label: "Desborde en", value: `~${Math.round(toMax)} min`, sub: `subiendo ${rate.toFixed(1)} cm/min` };
  }
  return { label: "Pronóstico", value: "Sin riesgo", sub: "nivel estable o bajando" };
}
