"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#0A0B0E] animate-pulse flex items-center justify-center text-zinc-500 text-xs font-mono">
            Loading Atelier Map...
        </div>
    ),
});

interface MapWithOverlayProps {
    location: { lat: number; lng: number } | null;
    locationInitialized: boolean;
    selectedAddress: string;
    onLocationChange: (loc: { lat: number; lng: number }) => void;
    onAddressChange: (address: string) => void;
    onChangeLocationClick: () => void;
}

export default function MapWithOverlay({
    location,
    locationInitialized,
    selectedAddress,
    onLocationChange,
    onAddressChange,
    onChangeLocationClick
}: MapWithOverlayProps) {
    return (
        <div className="w-full bg-[#121318] border border-zinc-800/80 rounded-[24px] overflow-hidden shadow-2xl flex flex-col group mt-4 transition-all hover:border-zinc-700">
            {/* Map Area */}
            <div className="w-full h-72 sm:h-80 relative z-0">
                {locationInitialized ? (
                    <LocationPicker
                        defaultLocation={location || undefined}
                        onChange={(loc) => {
                            onLocationChange(loc);
                            onAddressChange(`Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}`);
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-[#0A0B0E] animate-pulse flex items-center justify-center text-xs text-zinc-500 font-mono">
                        Loading map data...
                    </div>
                )}
            </div>
            
            {/* Unified Info Panel Area */}
            <div className="w-full p-5 sm:p-6 bg-gradient-to-b from-[#16171D] to-[#121318] flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-t border-zinc-800/80 relative">
                {/* Subtle top highlight for the panel */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#F5CA53]/20 to-transparent"></div>
                
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F5CA53]/10 border border-[#F5CA53]/30 flex items-center justify-center text-[#F5CA53] shrink-0 mt-0.5 shadow-[0_0_15px_rgba(245,202,83,0.1)]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                        <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-zinc-400 block mb-1">
                            Current Atelier Hub
                        </span>
                        <p className="text-sm sm:text-base font-extrabold text-white leading-tight font-heading">
                            {selectedAddress}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onChangeLocationClick}
                    className="w-full sm:w-auto px-6 py-3 bg-white text-black font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 hover:bg-[#F5CA53]"
                >
                    Change Area
                </button>
            </div>
        </div>
    );
}
