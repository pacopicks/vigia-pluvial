import { useState, type ReactNode } from "react";
import {
  BellRing,
  Bug,
  ChevronDown,
  CloudRain,
  Database,
  Droplet,
  Leaf,
  MessageCircleQuestion,
  Mountain,
  Phone,
  Radio,
  Timer,
  Trash2,
  Users,
  Waves,
} from "lucide-react";

import { StatusAlert } from "@/components/monitor/status-alert";
import { ReservoirMap } from "@/components/monitor/reservoir-map";
import { openChat } from "@/components/chat/chatbot";
import GreenInfraChart from "@/components/charts/green-infra-chart";
import { Testimonials } from "@/components/ui/testimonials";
import { CFG, fmtTime, LEVELS, type Sim } from "@/hooks/use-reservoir-sim";
import { answerOf, FAQS, type Faq } from "@/lib/faq";
import { EXPERTOS } from "@/lib/expertos";
import { cn } from "@/lib/utils";

function SectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
      {children && <p className="mt-4 text-gray-400">{children}</p>}
    </div>
  );
}

// Mapa para vecinos: explorable, con búsqueda y "Mi ubicación"
export function PublicMapSection({ sim }: { sim: Sim }) {
  const lv = LEVELS[sim.lvl];
  return (
    <section id="mapa" className="scroll-mt-20 border-t border-gray-900 px-6 py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <SectionHead title="Mira el bordo, la zona baja y la ruta de evacuación">
          El círculo marca la zona baja que se inunda primero y cambia de color con la alerta. La línea verde punteada es la ruta hacia el
          punto de reunión. Busca tu colonia o toca “Mi ubicación” para saber qué tan cerca estás.
        </SectionHead>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-sm">
          <span className="size-3 rounded-full" style={{ background: lv.color }} />
          <span className="font-medium">Ahora: {lv.title.toLowerCase()}</span>
          <span className="text-gray-400">· bordo al {Math.min(sim.last.p, 100).toFixed(0)}%</span>
          <span className="text-gray-400">· {lv.resident}</span>
        </div>
        <ReservoirMap sim={sim} audience="public" height={520} />
      </div>
    </section>
  );
}

const KIT = ["Documentos en bolsa de plástico", "Medicinas de uso diario", "Agua y comida que no se eche a perder", "Lámpara, pilas y cargador", "Cambio de ropa y cobija ligera", "Silbato"];

// Qué hacer en cada alerta, en lenguaje de vecino
export function WhatToDoSection({ sim }: { sim: Sim }) {
  return (
    <section id="protocolo" className="scroll-mt-20 border-t border-gray-900 px-6 py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <SectionHead title="Cada color te dice qué hacer">
          Las alertas llegan al grupo de WhatsApp del comité vecinal. El color depende de qué tan lleno está el bordo y de qué tan rápido
          sube el agua.
        </SectionHead>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map((l, i) => (
            <li
              key={l.key}
              className={cn("flex flex-col gap-3 rounded-xl border bg-gray-950 p-5", i === sim.lvl ? "ring-2" : "border-gray-800")}
              style={i === sim.lvl ? { borderColor: l.color, ["--tw-ring-color" as string]: `${l.color}55` } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-display text-lg font-bold" style={{ color: l.color }}>
                  <span className="size-3 rounded-full" style={{ background: l.color }} />
                  {l.name}
                </span>
                {i === sim.lvl && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">Ahora</span>}
              </div>
              <p className="text-xs text-gray-500">Bordo al {l.rule}</p>
              <p className="text-sm text-gray-200">{l.resident}</p>
            </li>
          ))}
        </ol>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-800 p-5">
            <p className="mb-3 font-display text-lg font-semibold">Ten lista tu mochila de emergencia</p>
            <ul className="grid gap-2 text-sm text-gray-300 sm:grid-cols-2">
              {KIT.map((k) => (
                <li key={k} className="flex gap-2">
                  <span className="text-agua">•</span>
                  {k}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-crit/40 bg-crit/5 p-5">
            <p className="flex items-center gap-2 font-display text-lg font-semibold">
              <Phone className="size-5 text-crit" aria-hidden /> En una emergencia, llama al 911
            </p>
            <p className="text-sm text-gray-300">
              No cruces calles con corriente: unos 15 cm de agua en movimiento pueden tirar a una persona. Ayuda primero a personas
              mayores, niños y personas con discapacidad.
            </p>
            <a href="#/monitor/simulacro" className="mt-auto flex items-center gap-2 text-sm text-agua hover:underline">
              <Timer className="size-4" aria-hidden /> Personal autorizado: simulacros por escenario
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function GreenSection({ sim }: { sim: Sim }) {
  return (
    <section id="verde" className="scroll-mt-20 border-t border-gray-900 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <GreenInfraChart
          hist={sim.hist}
          retainedM3={sim.env.greenInfraM3}
          captureLabel={`jardines de lluvia, zanjas vegetadas y captación en techos reteniendo el ${Math.round(CFG.GREEN_CAPTURE * 100)}% de la escorrentía`}
        />
      </div>
    </section>
  );
}

function FaqItem({ f, sim }: { f: Faq; sim: Sim }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-gray-800 bg-gray-950">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left font-medium"
      >
        {f.q}
        <ChevronDown className={cn("size-4 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && <p className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-gray-300">{answerOf(f, sim)}</p>}
    </li>
  );
}

export function FaqSection({ sim }: { sim: Sim }) {
  const cats = Array.from(new Set(FAQS.map((f) => f.category)));
  const [cat, setCat] = useState(cats[0]);
  return (
    <section id="preguntas" className="scroll-mt-20 border-t border-gray-900 px-6 py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead title="Lo que más nos preguntan" />
          <button
            type="button"
            onClick={() => openChat()}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-100"
          >
            <MessageCircleQuestion className="size-4" aria-hidden /> Pregúntale al asistente
          </button>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Temas">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={c === cat}
              onClick={() => setCat(c)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                c === cat ? "border-white bg-white text-black" : "border-gray-800 text-gray-400 hover:text-white",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {FAQS.filter((f) => f.category === cat).map((f) => (
            <FaqItem key={f.id} f={f} sim={sim} />
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ExpertsSection() {
  return (
    <section id="expertos" className="scroll-mt-20 border-t border-gray-900 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <Testimonials
          testimonials={EXPERTOS}
          title="¿Qué opinan los expertos?"
          description="Lo que plantean organismos y guías de referencia sobre alerta temprana, drenaje sostenible y salud. Son síntesis, no citas textuales: toca el ícono de cada tarjeta para ir a la fuente."
          maxDisplayed={6}
        />
      </div>
    </section>
  );
}

// Resumen en vivo del bordo para la portada
export function LivePreview({ sim, onOpenMonitor }: { sim: Sim; onOpenMonitor: () => void }) {
  const { last, rate, lvl } = sim;
  const tiles = [
    { label: "Llenado", value: `${Math.min(last.p, 100).toFixed(0)}%`, sub: `${last.L.toFixed(0)} de ${CFG.NIVEL_MAX} cm` },
    { label: "Ascenso", value: `${rate >= 0 ? "+" : ""}${rate.toFixed(2)}`, sub: "cm/min" },
    { label: "Lluvia", value: last.r.toFixed(1), sub: "mm/h ahora" },
    { label: "Turbidez", value: last.turb.toFixed(0), sub: "NTU en la entrada" },
  ];
  const spark = sim.hist.slice(-60);
  const w = 600;
  const h = 70;
  const pts = spark.map((d, i) => `${((i / (spark.length - 1)) * w).toFixed(1)},${(h - (Math.min(d.p, 100) / 100) * (h - 4) - 2).toFixed(1)}`);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4 shadow-2xl backdrop-blur sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-400">
          Bordo de retención piloto · lectura de las <span className="font-mono text-white">{fmtTime(sim.now)}</span>
        </p>
        <span className="flex items-center gap-1.5 rounded-full border border-gray-800 px-2.5 py-1 text-xs text-gray-400">
          <span className="size-2 animate-pulse rounded-full bg-ok" /> En vivo · datos simulados
        </span>
      </div>
      <StatusAlert lvl={lvl} last={last} rate={rate} compact />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-gray-800 bg-black/40 p-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">{t.label}</p>
            <p className="font-display text-2xl font-bold tabular-nums">{t.value}</p>
            <p className="text-xs text-gray-400">{t.sub}</p>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-16 w-full" preserveAspectRatio="none" role="img" aria-label="Llenado en la última hora">
        <polyline points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill="rgba(76,182,217,.15)" stroke="none" />
        <polyline points={pts.join(" ")} fill="none" stroke="#4cb6d9" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={onOpenMonitor} className="cursor-pointer text-sm text-agua hover:underline">
          Monitor completo (personal autorizado) →
        </button>
      </div>
    </div>
  );
}

const CAUSES = [
  { icon: Mountain, title: "Azolve y basura", text: "El sedimento y la basura reducen la capacidad del bordo sin que se note." },
  { icon: Database, title: "Sin datos en tiempo real", text: "No hay datos públicos del nivel del agua ni de su velocidad de llenado." },
  { icon: Trash2, title: "Mantenimiento reactivo", text: "Se limpia después del desbordamiento, no antes." },
  { icon: CloudRain, title: "Suelo impermeable", text: "El suelo sellado y sin vegetación aumenta el escurrimiento y el arrastre de sedimentos." },
  { icon: Users, title: "Vecinos fuera", text: "Solo el municipio opera los bordos: los vecinos no conocen su estado ni participan en su cuidado." },
];

const NATURE = [
  { icon: Mountain, title: "Erosión y pérdida de suelo", text: "La escorrentía arrastra suelo desnudo de las partes altas y lo deposita como azolve en bordos y canales." },
  { icon: Droplet, title: "Acuífero sin recarga", text: "El agua que cae en calles y techos se va al drenaje en vez de infiltrarse al subsuelo." },
  { icon: Waves, title: "Agua contaminada", text: "Al desbordar, la lluvia se mezcla con aguas residuales y llega contaminada a calles, canal y cauces." },
  { icon: Trash2, title: "Basura en los cauces", text: "Plásticos y residuos tapan rejillas y terminan aguas abajo." },
  { icon: Bug, title: "Agua estancada", text: "Los vasos que no drenan en uno o dos días se vuelven criaderos del mosquito del dengue." },
];

export function ProblemSection() {
  return (
    <section id="problema" className="scroll-mt-20 border-t border-gray-900 px-6 py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-end">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
              Las colonias de abajo reciben toda el agua de las partes altas
            </h2>
          </div>
          <p className="text-gray-400">
            Peñuelas, Menchaca y San José El Alto reciben el escurrimiento de las partes altas. En agosto de 2025 una tormenta de 146 mm
            desbordó el canal de Peñuelas: al menos dos personas murieron arrastradas por la corriente y se inundaron calles y viviendas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-800 p-5">
            <p className="font-display text-5xl font-bold text-white">
              146<span className="ml-1 text-xl font-normal text-gray-400">mm</span>
            </p>
            <p className="mt-1 text-sm text-gray-400">Lluvia de la tormenta de agosto de 2025</p>
          </div>
          <div className="rounded-xl border border-gray-800 p-5">
            <p className="font-display text-5xl font-bold text-gray-500">
              110<span className="ml-1 text-xl font-normal">mm</span>
            </p>
            <p className="mt-1 text-sm text-gray-400">Récord anterior</p>
          </div>
          <div className="rounded-xl border border-crit/40 bg-crit/5 p-5">
            <p className="font-display text-5xl font-bold text-crit">2</p>
            <p className="mt-1 text-sm text-gray-400">Personas muertas, como mínimo, arrastradas por la corriente</p>
          </div>
        </div>

        <p className="max-w-3xl text-gray-400">
          La respuesta fue infraestructura gris: los bordos de retención Cuates I y II y un nuevo dren pluvial en Peñuelas, con cientos de
          millones de pesos. Pero un reservorio no protege por sí solo. Pierde eficacia por causas que se alimentan entre sí:
        </p>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAUSES.map((c) => (
            <li key={c.title} className="flex gap-3 rounded-lg border border-gray-800 bg-gray-950 p-4">
              <c.icon className="mt-0.5 size-5 shrink-0 text-agua" aria-hidden />
              <div>
                <p className="font-medium text-white">{c.title}</p>
                <p className="text-sm text-gray-400">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <blockquote className="border-l-2 border-agua pl-5 font-display text-xl leading-snug text-white md:text-2xl">
          El verdadero problema no es la falta de obras: los reservorios se gestionan sin datos, de forma reactiva y desconectados de la
          cuenca que los alimenta y de la comunidad que protegen.
        </blockquote>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="size-5 text-ok" aria-hidden />
            <h3 className="font-display text-xl font-semibold">El daño a la naturaleza</h3>
          </div>
          <p className="max-w-3xl text-gray-400">
            Una inundación no solo daña casas. Cada tormenta mal gestionada también degrada la cuenca:
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {NATURE.map((n) => (
              <li key={n.title} className="rounded-lg border border-gray-800 p-4">
                <n.icon className="mb-2 size-5 text-ok" aria-hidden />
                <p className="text-sm font-medium text-white">{n.title}</p>
                <p className="mt-1 text-xs text-gray-400">{n.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    icon: Radio,
    title: "Monitoreo inteligente",
    text: "Sensores de nivel, lluvia y turbidez con energía solar, conectados por LoRaWAN o 4G a un tablero abierto. Un modelo con los datos de cada temporada anticipa el desborde y el azolve.",
  },
  {
    icon: Leaf,
    title: "Infraestructura verde",
    text: "Trampa de sedimentos, jardines de lluvia, zanjas vegetadas, pavimentos permeables y humedal: menos agua llega de golpe y la que llega va más limpia. Los mismos sensores miden si funcionan.",
  },
  {
    icon: BellRing,
    title: "Comunidad al frente",
    text: "Alertas escalonadas por WhatsApp y SMS al comité vecinal y a Protección Civil, protocolo con rutas de evacuación, simulacros y mantenimiento antes de la temporada de lluvias.",
  },
];

export function SolutionSection({ onOpenMonitor }: { onOpenMonitor: () => void }) {
  return (
    <section id="solucion" className="scroll-mt-20 border-t border-gray-900 px-6 py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
            Que el bordo se vigile, se mantenga a tiempo y reciba menos agua de golpe
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-950 p-6">
              <p.icon className="size-6 text-agua" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-white">{p.title}</h3>
              <p className="text-sm text-gray-400">{p.text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-800 p-6">
          <p className="text-gray-300">
            El comité y Protección Civil practican con simulacros de cada escenario, incluida la tormenta de agosto de 2025, antes de la
            temporada de lluvias.
          </p>
          <button
            type="button"
            onClick={onOpenMonitor}
            className="cursor-pointer rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gray-100"
          >
            Acceso personal autorizado
          </button>
        </div>
        <p className="text-xs text-gray-500">Equipo Cardenales · Universidad Politécnica de Querétaro · Rally Latinoamericano de Innovación 2026</p>
      </div>
    </section>
  );
}
