import {
  AdvancedMap,
  type LatLng,
  type MapCircle,
  type MapMarker,
  type MapPolygon,
  type MapPolyline,
} from "@/components/ui/advanced-map";
import { LEVELS, type Sim } from "@/hooks/use-reservoir-sim";

// Trazos aproximados en el norte de Querétaro para la demostración.
// Sustituir por la delimitación real de la microcuenca y la ubicación del bordo.
const CENTER: LatLng = [20.6458, -100.4095];
const CUENCA: LatLng[] = [
  [20.6525, -100.4175],
  [20.653, -100.406],
  [20.649, -100.4025],
  [20.643, -100.404],
  [20.642, -100.413],
  [20.6465, -100.4185],
];
const VASO: LatLng[] = [
  [20.6458, -100.4112],
  [20.6459, -100.409],
  [20.6445, -100.4086],
  [20.6442, -100.4108],
];
const CANAL: LatLng[] = [
  [20.6442, -100.4086],
  [20.643, -100.407],
  [20.6415, -100.4045],
  [20.64, -100.402],
];
const ZONA_BAJA: LatLng = [20.6427, -100.4072];
const PUNTO_REUNION: LatLng = [20.6495, -100.4045];
const RUTA: LatLng[] = [ZONA_BAJA, [20.645, -100.406], [20.6475, -100.405], PUNTO_REUNION];

export function ReservoirMap({ sim, audience = "team", height = 460 }: { sim: Sim; audience?: "team" | "public"; height?: number }) {
  const { last, lvl, nodes } = sim;
  const lv = LEVELS[lvl];
  const turbColor = last.turb > 100 ? "red" : last.turb > 50 ? "orange" : last.turb > 25 ? "gold" : "green";

  const markers: MapMarker[] = [
    ...nodes.map(
      (n): MapMarker => ({
        id: n.id,
        position: n.position,
        color: n.id === "N1" ? lv.marker : n.id === "N2" ? turbColor : "blue",
        size: n.id === "N1" ? "large" : "medium",
        popup: {
          title: `${n.id} · ${n.place}`,
          content: (
            <>
              <p>{n.sensor}</p>
              <p>
                Batería {n.batt.toFixed(0)}% · señal {n.rssi} dBm
              </p>
              {n.id === "N1" && (
                <p>
                  Nivel {last.L.toFixed(0)} cm · {Math.min(last.p, 100).toFixed(0)}% · {lv.title}
                </p>
              )}
              {n.id === "N2" && <p>Turbidez {last.turb.toFixed(0)} NTU</p>}
              {n.id === "N3" && <p>Lluvia {last.r.toFixed(1)} mm/h</p>}
            </>
          ),
        },
      }),
    ),
    {
      id: "gw",
      position: [20.649, -100.41],
      color: "violet",
      size: "small",
      popup: { title: "Gateway LoRaWAN", content: <p>Punto alto con energía. Respaldo 4G y SMS.</p> },
    },
    {
      id: "reunion",
      position: PUNTO_REUNION,
      color: "blue",
      size: "medium",
      popup: { title: "Punto de reunión", content: <p>Destino de la ruta de evacuación en alerta roja.</p> },
    },
    {
      id: "jardin-1",
      position: [20.65, -100.412],
      color: "green",
      size: "small",
      popup: { title: "Jardín de lluvia (propuesto)", content: <p>Camellón que capta la escorrentía de la calle antes de llegar al bordo.</p> },
    },
    {
      id: "jardin-2",
      position: [20.6476, -100.415],
      color: "green",
      size: "small",
      popup: { title: "Zanja vegetada (propuesta)", content: <p>Conduce despacio el agua y retiene sedimento.</p> },
    },
  ];

  const polygons: MapPolygon[] = [
    {
      id: "cuenca",
      positions: CUENCA,
      style: { color: "#4cb6d9", weight: 1.5, dashArray: "6 6", fillOpacity: 0.05 },
      popup: "Microcuenca de aportación (trazo de ejemplo): el agua de esta zona escurre hacia el bordo.",
    },
    {
      id: "vaso",
      positions: VASO,
      style: { color: "#2a7fae", weight: 2, fillColor: "#4cb6d9", fillOpacity: 0.25 + Math.min(last.p, 100) / 160 },
      popup: `Vaso del bordo · ${Math.min(last.p, 100).toFixed(0)}% de llenado`,
    },
  ];

  const circles: MapCircle[] = [
    {
      id: "zona-baja",
      center: ZONA_BAJA,
      radius: 260,
      style: { color: lv.color, weight: 2, fillOpacity: 0.08 + lvl * 0.08 },
      popup: `Zona baja expuesta a inundación · ${lv.title}`,
    },
  ];

  const polylines: MapPolyline[] = [
    { id: "canal", positions: CANAL, style: { color: "#2a7fae", weight: 5, opacity: 0.9 }, popup: "Canal pluvial aguas abajo del bordo" },
    {
      id: "ruta",
      positions: RUTA,
      style: { color: "#55c084", weight: 3, dashArray: "8 6" },
      popup: "Ruta de evacuación hacia el punto de reunión",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <AdvancedMap
        center={CENTER}
        zoom={15}
        markers={markers}
        polygons={polygons}
        circles={circles}
        polylines={polylines}
        enableClustering={false}
        showClickedLocation={false}
        mapLayers={{ openstreetmap: true, dark: true }}
        className="overflow-hidden rounded-lg border"
        style={{ height: `${height}px`, width: "100%" }}
      />
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: lv.color }} /> N1 nivel (color = alerta actual)
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-agua-2" /> Canal pluvial
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed border-ok" /> Ruta de evacuación
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t border-dashed border-agua" /> Microcuenca
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-ok" /> Infraestructura verde propuesta
        </li>
      </ul>
      {audience === "team" ? (
        <p className="text-xs text-muted-foreground">
          Trazos y posiciones aproximados para la demostración. Usa el buscador del mapa para ubicar Peñuelas, Menchaca o San José El Alto
          y sustituye las coordenadas por las reales de los bordos Cuates I y II.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Ubicaciones aproximadas del piloto. Escribe tu colonia en el buscador, usa “Mi ubicación” para verte en el mapa y toca cualquier
          marcador para ver qué mide.
        </p>
      )}
    </div>
  );
}
