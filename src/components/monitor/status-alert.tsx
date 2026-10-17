import type { CSSProperties } from "react";
import { CircleCheck, OctagonAlert, Siren, TriangleAlert, type LucideIcon } from "lucide-react";

import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { forecast, fmtTime, LEVELS, type Level, type LogEntry, type Reading } from "@/hooks/use-reservoir-sim";
import { cn } from "@/lib/utils";

// El componente de alerta no tiene variante naranja: se reutiliza "warning" con sus variables en naranja.
const ORANGE = {
  "--color-warning-soft": "#33200f",
  "--color-warning-alpha": "#7a4416",
  "--color-warning-foreground": "#f08a43",
} as CSSProperties;

const LEVEL_UI: Record<Level, { variant: "success" | "warning" | "destructive"; icon: LucideIcon; style?: CSSProperties }> = {
  0: { variant: "success", icon: CircleCheck },
  1: { variant: "warning", icon: TriangleAlert },
  2: { variant: "warning", icon: OctagonAlert, style: ORANGE },
  3: { variant: "destructive", icon: Siren },
};

export function StatusAlert({ lvl, last, rate, compact = false }: { lvl: Level; last: Reading; rate: number; compact?: boolean }) {
  const ui = LEVEL_UI[lvl];
  const f = forecast(last, rate);
  return (
    <Alert variant={ui.variant} appearance="light" size={compact ? "md" : "lg"} style={ui.style} aria-live="polite">
      <AlertIcon>
        <ui.icon />
      </AlertIcon>
      <AlertContent className="flex-1">
        <AlertTitle className="font-display text-lg">
          {LEVELS[lvl].title} · {Math.min(last.p, 100).toFixed(0)}% de llenado
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">{LEVELS[lvl].act}</AlertDescription>
      </AlertContent>
      {!compact && (
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{f.label}</p>
          <p className="font-mono text-xl font-medium tabular-nums">{f.value}</p>
          <p className="text-xs text-muted-foreground">{f.sub}</p>
        </div>
      )}
    </Alert>
  );
}

// Avisos emergentes cuando cambia el nivel de alerta (lo que recibiría el comité en el teléfono)
export function AlertToasts({ toasts, onClose, className }: { toasts: LogEntry[]; onClose: (id: number) => void; className?: string }) {
  return (
    <div className={cn("pointer-events-none fixed bottom-4 right-4 z-[1100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2", className)}>
      {toasts.map((t) => {
        const ui = t.test ? { variant: "info" as const, icon: CircleCheck, style: undefined } : LEVEL_UI[t.lvl];
        return (
          <Alert
            key={t.id}
            variant={ui.variant}
            appearance="light"
            size="md"
            close
            onClose={() => onClose(t.id)}
            style={ui.style}
            className="pointer-events-auto bg-card shadow-2xl [animation:slideDown_.3s_ease-out]"
          >
            <AlertIcon>
              <ui.icon />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>{t.msg}</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                {fmtTime(t.t)} · {t.canal}
              </AlertDescription>
            </AlertContent>
          </Alert>
        );
      })}
    </div>
  );
}
