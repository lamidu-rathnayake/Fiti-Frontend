"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

interface LocationPickerProps {
    onChange: (location: { lat: number; lng: number }) => void;
    defaultLocation?: { lat: number; lng: number };
}

// Center on Sri Lanka by default
const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 7;

function LocationMarker({ position, setPosition, onChange }: any) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });

    return position === null ? null : (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    setPosition(pos);
                    onChange({ lat: pos.lat, lng: pos.lng });
                },
            }}
        />
    );
}

function LocateControl({ setPosition, onChange }: any) {
    const map = useMap();
    const [locating, setLocating] = useState(false);

    const handleLocate = () => {
        setLocating(true);
        map.locate().on("locationfound", function (e) {
            setPosition(e.latlng);
            onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
            map.flyTo(e.latlng, map.getZoom() > 13 ? map.getZoom() : 13);
            setLocating(false);
        }).on("locationerror", function (e) {
            setLocating(false);
            alert("Could not access your location. Please check your browser permissions.");
        });
    };

    return (
        <div className="absolute top-2 right-2 z-[400]">
            <button
                type="button"
                onClick={handleLocate}
                disabled={locating}
                className="bg-white px-3 py-2 text-sm font-medium text-slate-700 rounded shadow hover:bg-slate-50 disabled:opacity-50"
            >
                {locating ? "Locating..." : "📍 Use My Location"}
            </button>
        </div>
    );
}

export default function LocationPicker({ onChange, defaultLocation }: LocationPickerProps) {
    const [position, setPosition] = useState<L.LatLng | null>(
        defaultLocation ? L.latLng(defaultLocation.lat, defaultLocation.lng) : null
    );

    return (
        <div className="w-full relative border border-slate-300 rounded-xl overflow-hidden">
            <div className="h-64 w-full relative z-0">
                <MapContainer
                    center={defaultLocation || DEFAULT_CENTER}
                    zoom={defaultLocation ? 13 : DEFAULT_ZOOM}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} onChange={onChange} />
                    <LocateControl setPosition={setPosition} onChange={onChange} />
                </MapContainer>
            </div>
            {position && (
                <div className="bg-slate-50 px-3 py-2 text-xs text-slate-500 border-t border-slate-200">
                    Selected Location: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </div>
            )}
        </div>
    );
}
