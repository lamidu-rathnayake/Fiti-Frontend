"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getClientProfile, updateClientProfile } from "@/lib/api/endpoints/profiles";
import { reverseGeocode } from "@/lib/geocoding";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#0A0B0E] animate-pulse flex items-center justify-center text-zinc-500 text-xs font-mono">
            Loading Atelier Map...
        </div>
    ),
});

interface MapWithOverlayProps {
    onLocationChange: (loc: { lat: number; lng: number }) => void;
}

export default function MapWithOverlay({ onLocationChange }: MapWithOverlayProps) {
    const { user } = useAuth();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>("Locating...");
    const [locationInitialized, setLocationInitialized] = useState(false);

    // Modal state
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [customAddressInput, setCustomAddressInput] = useState("");

    const fetchAddress = async (lat: number, lng: number): Promise<{ address: string; city: string } | null> => {
        setSelectedAddress("Resolving address...");
        const location = await reverseGeocode(lat, lng);

        if (!location) {
            setSelectedAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
            return null;
        }

        setSelectedAddress(location.address);
        return location;
    };

    useEffect(() => {
        const initLocation = async () => {
            if (user) {
                try {
                    const profile = await getClientProfile(user.uid);
                    if (profile.latitude && profile.longitude) {
                        const savedLoc = { lat: profile.latitude, lng: profile.longitude };
                        setLocation(savedLoc);
                        fetchAddress(savedLoc.lat, savedLoc.lng);
                        onLocationChange(savedLoc);
                        setLocationInitialized(true);
                        return;
                    }
                } catch {
                    // Fall back
                }
            }

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setLocation(loc);
                        fetchAddress(loc.lat, loc.lng);
                        onLocationChange(loc);
                        setLocationInitialized(true);
                    },
                    () => {
                        const fallbackLoc = { lat: 6.9271, lng: 79.8612 };
                        setLocation(fallbackLoc);
                        fetchAddress(fallbackLoc.lat, fallbackLoc.lng);
                        onLocationChange(fallbackLoc);
                        setLocationInitialized(true);
                    }
                );
            } else {
                const fallbackLoc = { lat: 6.9271, lng: 79.8612 };
                setLocation(fallbackLoc);
                fetchAddress(fallbackLoc.lat, fallbackLoc.lng);
                onLocationChange(fallbackLoc);
                setLocationInitialized(true);
            }
        };

        if (user !== undefined) {
            initLocation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleApplyLocation = async (newAddress: string, coords?: { lat: number; lng: number }) => {
        if (coords) {
            setLocation(coords);
            const addrResult = await fetchAddress(coords.lat, coords.lng);
            onLocationChange(coords);

            if (user?.uid) {
                try {
                    await updateClientProfile(user.uid, {
                        latitude: coords.lat,
                        longitude: coords.lng,
                        address: addrResult?.address || newAddress,
                        city: addrResult?.city || null
                    });
                } catch (e) {
                    console.error("Failed to update profile", e);
                }
            }
        } else {
            // For custom text address without coords, we just update the text 
            // (a real geocoding api would convert text to coords here)
            setSelectedAddress(newAddress);
            if (user?.uid) {
                try {
                    await updateClientProfile(user.uid, { address: newAddress });
                } catch (e) {
                    console.error("Failed to update profile", e);
                }
            }
        }
        setIsLocationModalOpen(false);
    };



    return (
        <>
            <div className="w-full bg-[#121318] border border-zinc-800/80 rounded-[24px] overflow-hidden shadow-2xl flex flex-col group mt-4 transition-all hover:border-zinc-700">
                {/* Map Area */}
                <div className="w-full h-72 sm:h-80 relative z-0">
                    {locationInitialized ? (
                        <LocationPicker
                            defaultLocation={location || undefined}
                            onChange={(loc) => {
                                setLocation(loc);
                                fetchAddress(loc.lat, loc.lng);
                                onLocationChange(loc);
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
                        onClick={() => {
                            setCustomAddressInput(selectedAddress);
                            setIsLocationModalOpen(true);
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-white text-black font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 hover:bg-[#F5CA53]"
                    >
                        Change Area
                    </button>
                </div>
            </div>

            {isLocationModalOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#121318] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                            <div>
                                <span className="text-[10px] font-mono tracking-[0.25em] text-[#F5CA53] uppercase block">
                                    LOCATION SELECTION
                                </span>
                                <h3 className="text-lg font-extrabold text-white font-heading">
                                    Change Delivery &amp; Atelier Area
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                                Enter Manual Address or Area:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customAddressInput}
                                    onChange={(e) => setCustomAddressInput(e.target.value)}
                                    placeholder="e.g. Main Road, Colombo 12"
                                    className="flex-1 px-4 py-2.5 bg-[#1A1B22] border border-zinc-800 focus:border-[#F5CA53] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                                />
                                <button
                                    onClick={() => handleApplyLocation(customAddressInput || "Main Road, Colombo 12")}
                                    className="px-5 py-2.5 bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setIsLocationModalOpen(false)}
                                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
