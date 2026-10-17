import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Info, Lock, Megaphone, Plus, Send, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildAlert, CHANNELS, COLONIAS, CONTINGENCY, DEFAULT_STEPS } from "@/lib/citizen-alert";
import { fmtTime, LEVELS, type Level, type Sim } from "@/hooks/use-reservoir-sim";
import { cn } from "@/lib/utils";

type AlertLevel = Exclude<Level, 0>;

// Abre el redactor con un nivel ya elegido (lo usa el simulacro)
export function composeCitizenAlert(lvl: AlertLevel) {
  window.dispatchEvent(new CustomEvent("vigia:compose", { detail: lvl }));
}

export function CitizenAlertComposer({ sim }: { sim: Sim }) {
  const inDrill = !!sim.drill && !sim.drill.done;
  const [lvl, setLvl] = useState<AlertLevel>((sim.lvl || 1) as AlertLevel);
  const [picked, setPicked] = useState<string[]>(() => DEFAULT_STEPS[lvl].map((i) => CONTINGENCY[lvl][i]));
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [areas, setAreas] = useState<string[]>(COLONIAS);
  const [channels, setChannels] = useState<string[]>(["whatsapp", "sms", "telegram", "tablero"]);
  const [exerciseManual, setExerciseManual] = useState(true);
  const [sent, setSent] = useState<string | null>(null);
  const exercise = inDrill || exerciseManual;

  const chooseLevel = (l: AlertLevel) => {
    setLvl(l);
    setPicked(DEFAULT_STEPS[l].map((i) => CONTINGENCY[l][i]));
    setSent(null);
  };

  useEffect(() => {
    const onCompose = (e: Event) => {
      chooseLevel((e as CustomEvent<AlertLevel>).detail);
      document.getElementById("ciudadania")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("vigia:compose", onCompose);
    return () => window.removeEventListener("vigia:compose", onCompose);
  }, []);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const options = [...CONTINGENCY[lvl], ...picked.filter((p) => !CONTINGENCY[lvl].includes(p))];

  const draft = useMemo(
    () => buildAlert({ lvl, exercise, steps: picked, areas, note, last: sim.last, rate: sim.rate, now: sim.now }),
    [lvl, exercise, picked, areas, note, sim.last, sim.rate, sim.now],
  );

  const tooMany = picked.length > 4;
  const canSend = picked.length >= 2 && !tooMany && areas.length > 0 && channels.length > 0;
  const channelLabels = CHANNELS.filter((c) => channels.includes(c.id)).map((c) => c.label);

  const send = () => {
    if (!canSend) return;
    const a = sim.broadcastCitizen({
      lvl,
      exercise,
      headline: draft.headline,
      description: draft.description,
      steps: picked,
      areas,
      channels: channelLabels,
      text: draft.text,
    });
    setSent(`${exercise ? "Simulacro enviado" : "Alerta registrada"} a las ${fmtTime(a.t)} por ${channelLabels.join(", ")}.`);
  };

  const lv = LEVELS[lvl];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <Megaphone className="size-5 text-primary" aria-hidden />
          Alertar a la ciudadanía
          {exercise ? (
            <Badge variant="outline" className="border-primary/50 text-primary">
              Simulacro
            </Badge>
          ) : (
            <Badge variant="destructive">Envío real</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Un solo mensaje con qué pasa, dónde y de 2 a 4 pasos a seguir, adaptado a cada canal. Sigue los campos del estándar internacional
          CAP (encabezado, descripción, instrucciones y zona). Los mensajes de simulacro empiezan y terminan con “ESTO ES UN SIMULACRO”, igual
          que las pruebas del Sistema Nacional de Alertas.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        {/* Formulario */}
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">1. Nivel de alerta</legend>
            <div className="flex flex-wrap gap-2">
              {([1, 2, 3] as AlertLevel[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lvl === l}
                  onClick={() => chooseLevel(l)}
                  className={cn("cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition-colors", lvl !== l && "text-muted-foreground hover:bg-accent")}
                  style={lvl === l ? { borderColor: LEVELS[l].color, background: `${LEVELS[l].color}22`, color: LEVELS[l].color } : undefined}
                >
                  {LEVELS[l].name}
                  {sim.lvl === l && <span className="ml-1.5 text-xs opacity-70">(actual)</span>}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              2. Pasos a seguir <span className="font-normal text-muted-foreground">({picked.length} elegidos · de 2 a 4)</span>
            </legend>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {options.map((stepText) => {
                const on = picked.includes(stepText);
                return (
                  <li key={stepText}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPicked((p) => toggle(p, stepText))}
                      className={cn("flex w-full cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-left text-sm", on ? "border-primary/50 bg-primary/5" : "hover:bg-accent")}
                    >
                      {on ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                      {stepText}
                    </button>
                  </li>
                );
              })}
            </ul>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = custom.trim();
                if (v && !picked.includes(v)) setPicked((p) => [...p, v]);
                setCustom("");
              }}
            >
              <label htmlFor="custom-step" className="sr-only">
                Agregar un paso propio
              </label>
              <Input id="custom-step" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Agregar un paso propio (ej. El albergue está en la escuela)" maxLength={80} />
              <Button type="submit" variant="outline" size="icon" aria-label="Agregar paso">
                <Plus />
              </Button>
            </form>
            {tooMany && <p className="text-xs text-crit">Son más de 4 pasos: un mensaje largo se lee menos. Quita alguno.</p>}
            {picked.length < 2 && <p className="text-xs text-warn">Elige al menos 2 pasos.</p>}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">3. Colonias</legend>
            <div className="flex flex-wrap gap-2">
              {COLONIAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={areas.includes(c)}
                  onClick={() => setAreas((a) => toggle(a, c))}
                  className={cn("cursor-pointer rounded-full border px-3 py-1.5 text-sm", areas.includes(c) ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent")}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">4. Canales</legend>
            <ul className="grid gap-2 sm:grid-cols-2">
              {CHANNELS.map((c) => {
                const on = channels.includes(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={!c.available}
                      aria-pressed={on}
                      onClick={() => setChannels((x) => toggle(x, c.id))}
                      className={cn(
                        "flex h-full w-full cursor-pointer flex-col gap-1 rounded-md border px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-60",
                        on ? "border-primary/50 bg-primary/5" : "hover:bg-accent",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {!c.available ? <Lock className="size-3.5" /> : on ? <CheckCircle2 className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground" />}
                        {c.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{c.how}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="alert-note" className="text-sm font-medium">
              5. Nota adicional <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input id="alert-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. Punto de reunión: escuela primaria de la colonia" maxLength={120} />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            {!inDrill && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={exerciseManual} onChange={(e) => setExerciseManual(e.target.checked)} className="size-4 accent-[var(--primary)]" />
                Marcar como simulacro
              </label>
            )}
            {inDrill && <span className="text-sm text-muted-foreground">Hay un simulacro en curso: el mensaje sale marcado como simulacro.</span>}
            <Button className="ml-auto" onClick={send} disabled={!canSend} variant={exercise ? "default" : "destructive"}>
              <Send />
              {exercise ? "Enviar simulacro" : "Emitir alerta"}
            </Button>
          </div>
          {sent && (
            <p className="flex items-center gap-2 rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm">
              <CheckCircle2 className="size-4 text-ok" /> {sent} Revisa la portada: el tablero público ya lo muestra.
              <button type="button" onClick={() => setSent(null)} aria-label="Cerrar" className="ml-auto cursor-pointer">
                <X className="size-4" />
              </button>
            </p>
          )}
          {!exercise && (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" /> En esta demostración no se envía nada a ningún teléfono: el mensaje solo se registra y aparece en el tablero público.
            </p>
          )}
        </div>

        {/* Vista previa */}
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium">Vista previa</p>
          <div className="rounded-[2rem] border-4 border-muted bg-[#0b141a] p-3 shadow-xl">
            <div className="mb-2 flex items-center gap-2 border-b border-white/10 px-2 pb-2">
              <span className="flex size-7 items-center justify-center rounded-full text-xs font-bold text-black" style={{ background: lv.color }}>
                VP
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Vigía Pluvial</p>
                <p className="text-[10px] text-white/50">Cuenta verificada · alertas de la colonia</p>
              </div>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              <div className="ml-1 mr-6 whitespace-pre-line rounded-lg rounded-tl-none bg-[#202c33] px-3 py-2 text-[13px] leading-relaxed text-[#e9edef]">
                {draft.text.split("*").map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <span key={i}>{part}</span>))}
                <span className="mt-1 block text-right text-[10px] text-white/40">{fmtTime(sim.now)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">SMS</span>
              <span className="font-mono">
                {draft.smsInfo.len}/{draft.smsInfo.single} · {draft.smsInfo.encoding} · {draft.smsInfo.segments} {draft.smsInfo.segments === 1 ? "mensaje" : "mensajes"}
              </span>
            </div>
            <p className="font-mono text-xs leading-relaxed">{draft.sms}</p>
          </div>

          <details className="rounded-lg border p-3 text-xs">
            <summary className="cursor-pointer font-medium">Formato CAP 1.2 (para sistemas de alerta)</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre text-[11px] leading-relaxed text-muted-foreground">{draft.cap}</pre>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}
