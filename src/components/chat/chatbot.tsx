import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Copy, Droplets, MessageCircleQuestion, RotateCcw, Send, X } from "lucide-react";

import { ChatBubble, ChatBubbleAction, ChatBubbleActionWrapper, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { answerOf, FAQS, matchFaq, SUGGESTED, type Faq } from "@/lib/faq";
import type { Sim } from "@/hooks/use-reservoir-sim";
import { cn } from "@/lib/utils";

interface Msg {
  id: number;
  from: "user" | "bot";
  text: string;
  faq?: Faq;
  loading?: boolean;
}

const WELCOME =
  "¡Hola! Soy el asistente de Vigía Pluvial. Te puedo decir cómo está el bordo ahora, qué hacer en cada alerta, dónde está el punto de reunión y más. Escribe tu pregunta o elige una de abajo.";

// Abre el chat desde cualquier parte de la página: openChat("¿Qué hago en alerta roja?")
export function openChat(question?: string) {
  window.dispatchEvent(new CustomEvent("vigia:open-chat", { detail: question }));
}

export function Chatbot({ sim, side = "left" }: { sim: Sim; side?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: "bot", text: WELCOME }]);
  const seq = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const simRef = useRef(sim);
  simRef.current = sim;

  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const userId = seq.current++;
    const botId = seq.current++;
    setMsgs((m) => [...m, { id: userId, from: "user", text: q }, { id: botId, from: "bot", text: "", loading: true }]);
    setInput("");
    window.setTimeout(() => {
      const f = matchFaq(q);
      const reply: Msg = f
        ? { id: botId, from: "bot", text: answerOf(f, simRef.current), faq: f }
        : {
            id: botId,
            from: "bot",
            text: "No tengo una respuesta para eso todavía. Prueba con otras palabras o elige una de las preguntas frecuentes. Si es una emergencia, llama al 911.",
          };
      setMsgs((m) => m.map((x) => (x.id === botId ? reply : x)));
    }, 650);
  };

  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent<string | undefined>).detail;
      if (q) ask(q);
    };
    window.addEventListener("vigia:open-chat", onOpen);
    return () => window.removeEventListener("vigia:open-chat", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.innerWidth < 640) setOpen(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* sin portapapeles: no pasa nada */
    }
  };

  const suggestions = SUGGESTED.map((id) => FAQS.find((f) => f.id === id)!).filter(Boolean);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente de preguntas"}
        className={cn(
          "fixed bottom-4 z-[1200] flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          side === "left" ? "left-4" : "right-4",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-5" /> : <MessageCircleQuestion className="size-5" />}
        <span className="hidden sm:inline">{open ? "Cerrar" : "¿Tienes dudas?"}</span>
      </button>

      {open && (
        <section
          aria-label="Asistente de preguntas frecuentes"
          className={cn("fixed bottom-20 z-[1200] flex h-[min(600px,calc(100svh-7rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl [animation:fadeIn_.25s_ease-out] max-sm:inset-x-2 max-sm:bottom-2 max-sm:h-[calc(100svh-1rem)] max-sm:w-auto", side === "left" ? "left-4" : "right-4")}
        >
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-agua/15 text-agua">
              <Droplets className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold leading-tight">Asistente Vigía</p>
              <p className="text-xs text-muted-foreground">Preguntas frecuentes · responde al momento</p>
            </div>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Reiniciar conversación" onClick={() => setMsgs([{ id: 0, from: "bot", text: WELCOME }])}>
              <RotateCcw />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Cerrar" onClick={() => setOpen(false)}>
              <X />
            </Button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 pt-4" aria-live="polite">
            {msgs.map((m) => (
              <ChatBubble key={m.id} variant={m.from === "user" ? "sent" : "received"}>
                <ChatBubbleAvatar
                  fallback={m.from === "user" ? "Tú" : <Droplets className="size-4 text-agua" />}
                  className={m.from === "user" ? "[&>span]:bg-primary/20 [&>span]:text-xs" : "[&>span]:bg-agua/15"}
                />
                <div className={cn("flex max-w-[85%] flex-col", m.from === "user" && "items-end")}>
                  <ChatBubbleMessage variant={m.from === "user" ? "sent" : "received"} isLoading={m.loading} className="text-sm leading-relaxed whitespace-pre-line">
                    {m.text}
                  </ChatBubbleMessage>
                  {m.from === "bot" && !m.loading && m.id !== 0 && (
                    <ChatBubbleActionWrapper>
                      <ChatBubbleAction label="Copiar respuesta" icon={<Copy className="size-3" />} onClick={() => copy(m.text)} />
                      {m.faq?.action && document.getElementById(m.faq.action.target) && (
                        <button
                          type="button"
                          onClick={() => goTo(m.faq!.action!.target)}
                          className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-agua hover:bg-accent"
                        >
                          {m.faq.action.label} <ArrowRight className="size-3" />
                        </button>
                      )}
                    </ChatBubbleActionWrapper>
                  )}
                </div>
              </ChatBubble>
            ))}
          </div>

          <div className="border-t px-4 pt-3">
            <p className="mb-2 text-xs text-muted-foreground">Preguntas frecuentes</p>
            <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto pb-1">
              {suggestions.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => ask(f.q)}
                  className="cursor-pointer rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-agua hover:text-foreground"
                >
                  {f.q}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="flex gap-2 p-4">
            <label htmlFor="chat-input" className="sr-only">
              Escribe tu pregunta
            </label>
            <Input id="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta…" autoComplete="off" />
            <Button type="submit" size="icon" aria-label="Enviar" disabled={!input.trim()}>
              <Send />
            </Button>
          </form>
        </section>
      )}
    </>
  );
}
