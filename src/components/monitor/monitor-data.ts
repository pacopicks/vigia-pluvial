import { BellRing, CloudRain, Gauge, Leaf, Map, Megaphone, Radio, ShieldAlert, Sprout, Timer, type LucideIcon } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";

// Datos fijos del monitor. Las lecturas en vivo vienen de useReservoirSim.

export const monitorUser = {
  name: "Comité vecinal de agua",
  role: "Cuenca de Peñuelas",
  initials: "CV",
};

export const monitorSections: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "resumen", label: "Resumen", icon: Gauge },
  { id: "graficas", label: "Nivel y lluvia", icon: CloudRain },
  { id: "mapa", label: "Mapa de la cuenca", icon: Map },
  { id: "simulacro", label: "Simulacro", icon: Timer },
  { id: "ciudadania", label: "Alertar a la ciudadanía", icon: Megaphone },
  { id: "ambiente", label: "Daño ambiental", icon: Leaf },
  { id: "verde", label: "Infraestructura verde", icon: Sprout },
  { id: "nodos", label: "Nodos de campo", icon: Radio },
  { id: "bitacora", label: "Bitácora de alertas", icon: BellRing },
  { id: "protocolo", label: "Protocolo", icon: ShieldAlert },
];

export const levelChartConfig = {
  llenado: { label: "Llenado (%)", color: "#4cb6d9" },
} satisfies ChartConfig;

export const rainChartConfig = {
  lluvia: { label: "Lluvia (mm/h)", color: "#2a7fae" },
} satisfies ChartConfig;

// Contexto real del caso (agosto de 2025, norte de Querétaro)
export const caseContext = {
  colonias: ["Peñuelas", "Menchaca", "San José El Alto"],
  stormMm: 146,
  prevRecordMm: 110,
  infra: ["Bordo de retención Cuates I", "Bordo de retención Cuates II", "Dren pluvial de Peñuelas"],
};
