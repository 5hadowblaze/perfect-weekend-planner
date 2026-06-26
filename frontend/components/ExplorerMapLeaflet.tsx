"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { DiscoverEvent } from "@/lib/types";

interface ExplorerMapLeafletProps {
  events: DiscoverEvent[];
  center: { lat: number; lng: number };
  selectedId: string | null;
  onSelectEvent: (id: string) => void;
}

function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  return null;
}

export default function ExplorerMapLeaflet({
  events,
  center,
  selectedId,
  onSelectEvent,
}: ExplorerMapLeafletProps) {
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  );

  const mapCenter: [number, number] = selectedEvent
    ? [selectedEvent.lat, selectedEvent.lng]
    : [center.lat, center.lng];
  const zoom = selectedEvent ? 13 : 11;

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      className="h-full w-full z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={mapCenter} zoom={zoom} />
      {events.map((event) => {
        const isSelected = selectedId === event.id;
        return (
          <CircleMarker
            key={event.id}
            center={[event.lat, event.lng]}
            radius={isSelected ? 10 : 7}
            pathOptions={{
              color: "#ffffff",
              weight: isSelected ? 3 : 2,
              fillColor: isSelected ? "#1a73e8" : "#ea4335",
              fillOpacity: isSelected ? 1 : 0.9,
            }}
            eventHandlers={{
              click: () => onSelectEvent(event.id),
            }}
          />
        );
      })}
    </MapContainer>
  );
}
