import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

// Fix for default markers in React-Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type LatLng = [number, number];
export type MarkerColor = "blue" | "gold" | "red" | "green" | "orange" | "yellow" | "violet" | "grey" | "black";
export type MarkerSize = "small" | "medium" | "large";

export interface MapMarker {
  id?: string | number;
  position: LatLng;
  color?: MarkerColor;
  size?: MarkerSize;
  icon?: L.Icon | L.DivIcon;
  popup?: { title: string; content: React.ReactNode; image?: string };
}
export interface MapPolygon {
  id?: string | number;
  positions: LatLng[];
  style?: L.PathOptions;
  popup?: React.ReactNode;
}
export interface MapCircle {
  id?: string | number;
  center: LatLng;
  radius: number;
  style?: L.PathOptions;
  popup?: React.ReactNode;
}
export interface MapPolyline {
  id?: string | number;
  positions: LatLng[];
  style?: L.PathOptions;
  popup?: React.ReactNode;
}
type LayerKey = "openstreetmap" | "dark" | "satellite";
type Layers = Record<LayerKey, boolean>;

// Custom marker icons (cached so re-renders don't rebuild them)
const iconCache = new Map<string, L.Icon>();
const createCustomIcon = (color: MarkerColor = "blue", size: MarkerSize = "medium") => {
  const key = `${color}-${size}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const sizes: Record<MarkerSize, [number, number]> = {
    small: [20, 32],
    medium: [25, 41],
    large: [30, 50],
  };
  const [w, h] = sizes[size];
  const icon = new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [1, -h + 7],
    shadowSize: [41, 41],
  });
  iconCache.set(key, icon);
  return icon;
};

// Map event handler component
const MapEvents = ({
  onMapClick,
  onLocationFound,
}: {
  onMapClick?: (latlng: L.LatLng) => void;
  onLocationFound?: (latlng: LatLng) => void;
}) => {
  const map = useMapEvents({
    click: (e) => {
      onMapClick?.(e.latlng);
    },
    locationfound: (e) => {
      onLocationFound?.([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return null;
};

const controlBox =
  "background:#0b171b;color:#e2edf0;padding:6px;border-radius:8px;border:1px solid #1b2f37;box-shadow:0 4px 16px rgba(0,0,0,.35);display:flex;gap:4px;flex-wrap:wrap;font-family:inherit";
const controlBtn =
  "padding:6px 10px;border:1px solid #1b2f37;border-radius:6px;cursor:pointer;background:#12232a;color:#e2edf0;font:inherit;font-size:12px";

// Custom control component
const CustomControls = ({ onToggleLayer }: { onToggleLayer: (layer: LayerKey) => void }) => {
  const map = useMap();

  useEffect(() => {
    const control = new L.Control({ position: "topright" });

    control.onAdd = () => {
      const div = L.DomUtil.create("div", "custom-controls");
      div.innerHTML = `
        <div style="${controlBox}">
          <button data-act="locate" style="${controlBtn}">Mi ubicación</button>
          <button data-act="satellite" style="${controlBtn}">Satélite</button>
          <button data-act="dark" style="${controlBtn}">Claro / oscuro</button>
        </div>
      `;

      L.DomEvent.disableClickPropagation(div);
      div.querySelector<HTMLButtonElement>('[data-act="locate"]')!.onclick = () => map.locate();
      div.querySelector<HTMLButtonElement>('[data-act="satellite"]')!.onclick = () => onToggleLayer("satellite");
      div.querySelector<HTMLButtonElement>('[data-act="dark"]')!.onclick = () => onToggleLayer("dark");

      return div;
    };

    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, onToggleLayer]);

  return null;
};

// Search component
const SearchControl = ({ onSearch }: { onSearch?: (r: { latLng: LatLng; name: string }) => void }) => {
  const map = useMap();
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    const control = new L.Control({ position: "topleft" });

    control.onAdd = () => {
      const div = L.DomUtil.create("div", "search-control");
      div.innerHTML = `
        <div style="${controlBox};flex-wrap:nowrap">
          <input id="map-search-input" type="text" placeholder="Buscar lugar..." aria-label="Buscar lugar"
            style="padding:6px 8px;border:1px solid #1b2f37;border-radius:6px;width:180px;background:#04090b;color:#e2edf0;font:inherit;font-size:12px" />
          <button id="map-search-btn" style="${controlBtn};background:#4cb6d9;color:#04121a;font-weight:600">Buscar</button>
        </div>
      `;

      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);

      const input = div.querySelector<HTMLInputElement>("#map-search-input")!;
      const button = div.querySelector<HTMLButtonElement>("#map-search-btn")!;

      // Se lee el valor del input al momento de buscar
      const handleSearch = async () => {
        const query = input.value.trim();
        if (!query) return;
        try {
          // Using Nominatim API for geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
          );
          const results = await response.json();
          if (results.length > 0) {
            const { lat, lon, display_name } = results[0];
            const latLng: LatLng = [parseFloat(lat), parseFloat(lon)];
            map.flyTo(latLng, 15);
            onSearchRef.current?.({ latLng, name: display_name });
          }
        } catch (error) {
          console.error("Search error:", error);
        }
      };

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSearch();
      });
      button.addEventListener("click", handleSearch);

      return div;
    };

    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);

  return null;
};

function MarkerItem({ marker, onMarkerClick }: { marker: MapMarker; onMarkerClick?: (m: MapMarker) => void }) {
  return (
    <Marker
      position={marker.position}
      icon={marker.icon || createCustomIcon(marker.color, marker.size)}
      eventHandlers={{ click: () => onMarkerClick?.(marker) }}
    >
      {marker.popup && (
        <Popup>
          <div>
            <h3>{marker.popup.title}</h3>
            <div>{marker.popup.content}</div>
            {marker.popup.image && (
              <img src={marker.popup.image} alt={marker.popup.title} style={{ maxWidth: "100%", height: "auto" }} />
            )}
          </div>
        </Popup>
      )}
    </Marker>
  );
}

export interface AdvancedMapProps {
  center?: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  polygons?: MapPolygon[];
  circles?: MapCircle[];
  polylines?: MapPolyline[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (latlng: L.LatLng) => void;
  enableClustering?: boolean;
  enableSearch?: boolean;
  enableControls?: boolean;
  showClickedLocation?: boolean;
  mapLayers?: Partial<Layers>;
  className?: string;
  style?: React.CSSProperties;
}

// Main AdvancedMap component
export const AdvancedMap = ({
  center = [51.505, -0.09],
  zoom = 13,
  markers = [],
  polygons = [],
  circles = [],
  polylines = [],
  onMarkerClick,
  onMapClick,
  enableClustering = true,
  enableSearch = true,
  enableControls = true,
  showClickedLocation = true,
  mapLayers,
  className = "",
  style = { height: "500px", width: "100%" },
}: AdvancedMapProps) => {
  const [currentLayers, setCurrentLayers] = useState<Layers>({
    openstreetmap: true,
    dark: false,
    satellite: false,
    ...mapLayers,
  });
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [searchResult, setSearchResult] = useState<{ latLng: LatLng; name: string } | null>(null);
  const [clickedLocation, setClickedLocation] = useState<L.LatLng | null>(null);

  // Handle layer toggling
  const handleToggleLayer = useCallback((layerType: LayerKey) => {
    setCurrentLayers((prev) => ({ ...prev, [layerType]: !prev[layerType] }));
  }, []);

  // Handle map click
  const handleMapClick = useCallback(
    (latlng: L.LatLng) => {
      if (showClickedLocation) setClickedLocation(latlng);
      onMapClick?.(latlng);
    },
    [onMapClick, showClickedLocation],
  );

  return (
    // El modo oscuro filtra los mosaicos de OpenStreetMap (sin servicios que pidan clave de API)
    <div className={`advanced-map ${currentLayers.dark && !currentLayers.satellite ? "map-dark" : ""} ${className}`} style={style}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        {/* Base tile layers */}
        {currentLayers.openstreetmap && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        {currentLayers.satellite && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* Map events */}
        <MapEvents onMapClick={handleMapClick} onLocationFound={setUserLocation} />

        {/* Search control */}
        {enableSearch && <SearchControl onSearch={setSearchResult} />}

        {/* Custom controls */}
        {enableControls && <CustomControls onToggleLayer={handleToggleLayer} />}

        {/* Polygons */}
        {polygons.map((polygon, index) => (
          <Polygon
            key={polygon.id ?? index}
            positions={polygon.positions}
            pathOptions={polygon.style || { color: "purple", weight: 2, fillOpacity: 0.3 }}
          >
            {polygon.popup && <Popup>{polygon.popup}</Popup>}
          </Polygon>
        ))}

        {/* Circles */}
        {circles.map((circle, index) => (
          <Circle
            key={circle.id ?? index}
            center={circle.center}
            radius={circle.radius}
            pathOptions={circle.style || { color: "blue", weight: 2, fillOpacity: 0.2 }}
          >
            {circle.popup && <Popup>{circle.popup}</Popup>}
          </Circle>
        ))}

        {/* Polylines */}
        {polylines.map((polyline, index) => (
          <Polyline
            key={polyline.id ?? index}
            positions={polyline.positions}
            pathOptions={polyline.style || { color: "red", weight: 3 }}
          >
            {polyline.popup && <Popup>{polyline.popup}</Popup>}
          </Polyline>
        ))}

        {/* Markers with clustering */}
        {enableClustering ? (
          <MarkerClusterGroup>
            {markers.map((marker, index) => (
              <MarkerItem key={marker.id ?? index} marker={marker} onMarkerClick={onMarkerClick} />
            ))}
          </MarkerClusterGroup>
        ) : (
          markers.map((marker, index) => (
            <MarkerItem key={marker.id ?? index} marker={marker} onMarkerClick={onMarkerClick} />
          ))
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={createCustomIcon("violet", "medium")}>
            <Popup>Tu ubicación actual</Popup>
          </Marker>
        )}

        {/* Search result marker */}
        {searchResult && (
          <Marker position={searchResult.latLng} icon={createCustomIcon("blue", "large")}>
            <Popup>{searchResult.name}</Popup>
          </Marker>
        )}

        {/* Clicked location marker */}
        {clickedLocation && (
          <Marker position={[clickedLocation.lat, clickedLocation.lng]} icon={createCustomIcon("grey", "small")}>
            <Popup>
              Lat: {clickedLocation.lat.toFixed(6)}
              <br />
              Lng: {clickedLocation.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default AdvancedMap;
