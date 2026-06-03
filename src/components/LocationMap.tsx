import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name?: string;
}

const LocationMap = ({ latitude, longitude, name }: LocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([latitude, longitude], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker([latitude, longitude]).addTo(map);
    if (name) marker.bindPopup(name).openPopup();

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
    };
  }, [latitude, longitude, name]);

  return (
    <div
      ref={mapRef}
      className="h-48 rounded-lg border border-border overflow-hidden z-0"
    />
  );
};

export default LocationMap;
