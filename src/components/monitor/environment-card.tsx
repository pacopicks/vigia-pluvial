import { Bug, Droplet, Mountain, Recycle, Sprout, Trash2, Waves, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CFG, type Risk, type Sim } from "@/hooks/use-reservoir-sim";
import { cn } from "@/lib/utils";

const RISK_STYLE: Record<Risk, string> = {
  bajo: "border-ok/40 bg-ok/10 text-ok",
  medio: "border-warn/40 bg-warn/10 text-warn",
  alto: "border-crit/40 bg-crit/10 text-crit",
};

function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <Badge variant="outline" className={cn("capitalize", RISK_STYLE[risk])}>
      Riesgo {risk}
    </Badge>
  );
}

const nf = (n: number, d = 0) => n.toLocaleString("es-MX", { maximumFractionDigits: d, minimumFractionDigits: d });

function Item({
  icon: Icon,
  title,
  value,
  unit,
  children,
  risk,
}: {
  icon: LucideIcon;
  title: string;
  value?: string;
  unit?: string;
  children: React.ReactNode;
  risk?: Risk;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-background/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {title}
        </span>
        {risk && <RiskBadge risk={risk} />}
      </div>
      {value && (
        <p className="font-display text-2xl font-bold tabular-nums">
          {value}
          {unit && <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">{unit}</span>}
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export function EnvironmentCard({ sim }: { sim: Sim }) {
  const e = sim.env;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Daño a la naturaleza</CardTitle>
        <CardDescription>
          Lo que la lluvia está arrastrando hacia el bordo y el canal, estimado con las lecturas en vivo. Cifras de orden de magnitud con una
          microcuenca de ejemplo de {CFG.CUENCA_HA} ha y {Math.round(CFG.IMPERMEABLE * 100)}% de suelo impermeable.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Item icon={Mountain} title="Sedimento arrastrado (24 h)" value={nf(e.sedimentT, 1)} unit="t" risk={e.erosion}>
          Suelo desnudo que la escorrentía erosiona y deposita como azolve. Cada tonelada resta capacidad útil al bordo y enturbia el
          agua.
        </Item>
        <Item icon={Droplet} title="Lluvia que no recargó el acuífero (24 h)" value={nf(e.lostRechargeM3)} unit="m³">
          Agua que cayó sobre calles, techos y patios y se fue directo al drenaje en lugar de infiltrarse al subsuelo.
        </Item>
        <Item icon={Sprout} title="Recuperable con infraestructura verde" value={nf(e.greenInfraM3)} unit="m³">
          Lo que se quedaría en origen si jardines de lluvia, zanjas vegetadas y captación en techos retuvieran el{" "}
          {Math.round(CFG.GREEN_CAPTURE * 100)}% de la escorrentía.
        </Item>
        <Item icon={Waves} title="Mezcla con aguas residuales" risk={e.sewage}>
          Cuando el bordo se llena o desborda, el agua de lluvia se junta con drenaje sanitario y llega contaminada al canal y a las
          calles. {e.overflowMin > 0 ? `Minutos con desborde: ${e.overflowMin}.` : "Sin desbordes registrados en esta sesión."}
        </Item>
        <Item icon={Bug} title="Agua estancada y mosquitos" risk={e.mosquito}>
          {e.wetHours >= 1 ? `${nf(e.wetHours, 0)} h con agua sobre el fondo. ` : ""}
          Si el vaso no drena en uno o dos días se vuelve criadero del mosquito del dengue.
        </Item>
        <Item icon={Trash2} title="Basura arrastrada al cauce" risk={sim.last.r > 30 ? "alto" : sim.last.r > 10 ? "medio" : "bajo"}>
          Las lluvias fuertes llevan plásticos y residuos a rejillas y canales. Rejillas tapadas aceleran el desborde y la basura termina
          aguas abajo.
        </Item>
      </CardContent>
      <CardContent className="pt-0">
        <p className="flex items-start gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          <Recycle className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
          La trampa de sedimentos, los taludes vegetados y el humedal construido atacan estos daños en el origen. El sensor de turbidez en
          la entrada mide si funcionan: menos NTU en tormentas parecidas significa menos suelo perdido.
        </p>
      </CardContent>
    </Card>
  );
}
