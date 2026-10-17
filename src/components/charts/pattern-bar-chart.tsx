import { useId, type CSSProperties, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/soft-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// Barras agrupadas: la primera serie con patrón punteado y la segunda sólida, para distinguirlas sin depender solo del color.
export interface PatternBarChartProps {
  title: string;
  description?: string;
  badge?: { label: ReactNode; icon?: ReactNode; variant?: "success-light" | "warning-light" | "destructive-light" | "info-light" };
  data: Record<string, string | number | null>[];
  xKey: string;
  patternKey: string;
  solidKey: string;
  config: ChartConfig;
  unit?: string;
  emptyText?: string;
  footer?: ReactNode;
  className?: string;
}

function PatternBarChart({
  title,
  description,
  badge,
  data,
  xKey,
  patternKey,
  solidKey,
  config,
  unit = "",
  emptyText = "Sin datos todavía.",
  footer,
  className,
}: PatternBarChartProps) {
  const patternId = `chart9-dotted-${useId().replace(/:/g, "")}`;

  return (
    <Card className={className ?? "w-full"}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          {title}
          {badge && (
            <Badge variant={badge.variant ?? "success-light"}>
              {badge.icon}
              {badge.label}
            </Badge>
          )}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-60 w-full">
            <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 12, bottom: 4, left: 0 }}>
              <defs>
                <pattern id={patternId} x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
                  <rect width="5" height="5" fill={`var(--color-${patternKey})`} opacity="0.1" />
                  <circle cx="5" cy="5" r="1.4" fill={`var(--color-${patternKey})`} opacity={1} />
                </pattern>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} interval={0} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    className="min-w-44 gap-2.5"
                    labelFormatter={(value) => (
                      <div className="mb-0.5 flex flex-col gap-0.5 border-b border-border/50 pb-2">
                        <span className="text-xs font-medium">{value}</span>
                      </div>
                    )}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-xs bg-(--color-bg)"
                            style={{ "--color-bg": `var(--color-${name})` } as CSSProperties}
                          />
                          <span className="text-muted-foreground">{config[name as keyof typeof config]?.label || name}</span>
                        </div>
                        <span className="font-semibold text-foreground">
                          {value === null || value === undefined ? "no llegó" : `${Number(value).toLocaleString("es-MX")}${unit}`}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey={patternKey}
                fill={`url(#${patternId})`}
                stroke={`var(--color-${patternKey})`}
                strokeWidth={1}
                radius={[4, 4, 4, 4]}
                isAnimationActive={false}
              />
              <Bar
                dataKey={solidKey}
                fill={`var(--color-${solidKey})`}
                stroke={`var(--color-${solidKey})`}
                strokeWidth={1}
                radius={[4, 4, 4, 4]}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        )}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs border" style={{ borderColor: String(config[patternKey]?.color), background: "transparent", backgroundImage: `radial-gradient(${config[patternKey]?.color} 1px, transparent 1.2px)`, backgroundSize: "4px 4px" }} />
            {config[patternKey]?.label}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs" style={{ background: String(config[solidKey]?.color) }} />
            {config[solidKey]?.label}
          </span>
        </div>
        {footer}
      </CardContent>
    </Card>
  );
}

export default PatternBarChart;
