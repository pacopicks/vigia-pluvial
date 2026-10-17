import { useState } from "react";
import { Map, Megaphone, X } from "lucide-react";

import { fmtTime, LEVELS, type Sim } from "@/hooks/use-reservoir-sim";

// Lo que ve la ciudadanía en el tablero público cuando el personal emite una alerta
export function CitizenAlertBanner({ sim }: { sim: Sim }) {
  const a = sim.citizenAlerts[0];
  const [hidden, setHidden] = useState<number | null>(null);
  if (!a || hidden === a.id) return null;
  const lv = LEVELS[a.lvl];

  return (
    <section
      role="alert"
      aria-label="Alerta a la ciudadanía"
      className="relative z-10 mx-auto mb-10 w-full max-w-3xl rounded-xl border-2 p-5 text-left [animation:fadeIn_.4s_ease-out]"
      style={{ borderColor: lv.color, background: `${lv.color}14` }}
    >
      <button type="button" onClick={() => setHidden(a.id)} aria-label="Ocultar alerta" className="absolute right-3 top-3 cursor-pointer text-gray-400 hover:text-white">
        <X className="size-4" />
      </button>
      {a.exercise && (
        <p className="mb-2 inline-flex rounded-full bg-white px-2.5 py-0.5 text-xs font-bold tracking-wide text-black">ESTO ES UN SIMULACRO</p>
      )}
      <p className="flex items-center gap-2 pr-6 font-display text-xl font-bold" style={{ color: lv.color }}>
        <Megaphone className="size-5 shrink-0" aria-hidden /> {a.headline}
      </p>
      <p className="mt-2 text-sm text-gray-300">{a.description}</p>
      <p className="mt-4 text-sm font-semibold text-white">Qué hacer ahora:</p>
      <ol className="mt-2 grid gap-2 sm:grid-cols-2">
        {a.steps.map((s, i) => (
          <li key={s} className="flex items-start gap-2 rounded-lg bg-black/40 px-3 py-2 text-sm text-white">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black" style={{ background: lv.color }}>
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <span>
          Emitida a las {fmtTime(a.t)} · {a.channels.join(", ")}
        </span>
        <button
          type="button"
          onClick={() => document.getElementById("mapa")?.scrollIntoView({ behavior: "smooth" })}
          className="flex cursor-pointer items-center gap-1.5 font-medium text-white hover:underline"
        >
          <Map className="size-3.5" /> Ver la ruta en el mapa
        </button>
      </div>
    </section>
  );
}
