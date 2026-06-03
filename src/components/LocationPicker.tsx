import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

const LocationPicker = ({ latitude, longitude, onChange }: LocationPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultLat = latitude || 9.02;
    const defaultLng = longitude || 38.75;

    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current!.getLatLng();
        onChange(pos.lat, pos.lng);
      });
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current!.getLatLng();
          onChange(pos.lat, pos.lng);
        });
      }
      onChange(lat, lng);
    });

    // Resize fix for dialogs
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker position when props change externally
  useEffect(() => {
    if (markerRef.current && latitude && longitude) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current?.setView([latitude, longitude], 13);
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="h-48 rounded-lg border border-border overflow-hidden z-0"
      />
      {latitude && longitude && (
        <p className="text-xs text-muted-foreground">
          📍 {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
