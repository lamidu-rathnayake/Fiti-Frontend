"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getClientProfile } from "@/lib/api/endpoints/profiles";
import { listNearbyShops } from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#131418] animate-pulse flex items-center justify-center text-zinc-500 text-xs font-mono">
            Loading Atelier Map...
        </div>
    ),
});

const LOCATION_PRESETS = [
    { label: "Main Road, Colombo 12", lat: 6.9385, lng: 79.8542 },
    { label: "Cinnamon Gardens, Colombo 07", lat: 6.9102, lng: 79.8653 },
    { label: "Nugegoda Highlevel Rd", lat: 6.8745, lng: 79.8864 },
    { label: "Kandy City Center", lat: 7.2906, lng: 80.6337 },
    { label: "Galle Fort, Galle", lat: 6.0305, lng: 80.2170 },
    { label: "Pettah Commercial Zone", lat: 6.9355, lng: 79.8510 },
];

export default function ClientHomePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>("Main Road, Colombo 12");
    const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [locationInitialized, setLocationInitialized] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Manual location selection modal states
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [customAddressInput, setCustomAddressInput] = useState("");

    useEffect(() => {
        const initLocation = async () => {
            if (user) {
                try {
                    const profile = await getClientProfile(user.uid);
                    if (profile.latitude && profile.longitude) {
                        const savedLoc = { lat: profile.latitude, lng: profile.longitude };
                        setLocation(savedLoc);
                        loadNearbyShops(savedLoc.lat, savedLoc.lng);
                        setLocationInitialized(true);
                        return;
                    }
                } catch {
                    // Fall back to default location
                }
            }

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setLocation(loc);
                        loadNearbyShops(loc.lat, loc.lng);
                        setLocationInitialized(true);
                    },
                    () => {
                        loadNearbyShops(6.9271, 79.8612);
                        setLocationInitialized(true);
                    }
                );
            } else {
                loadNearbyShops(6.9271, 79.8612);
                setLocationInitialized(true);
            }
        };

        initLocation();
    }, [user]);

    const loadNearbyShops = async (lat: number, lng: number) => {
        setLoadingShops(true);
        try {
            const shops = await listNearbyShops({ lat, lng, radius_km: 25 });
            setNearbyShops(shops);
        } catch {
            setNearbyShops([]);
        } finally {
            setLoadingShops(false);
        }
    };

    const handleApplyLocation = (newAddress: string, coords?: { lat: number; lng: number }) => {
        setSelectedAddress(newAddress);
        if (coords) {
            setLocation(coords);
            loadNearbyShops(coords.lat, coords.lng);
        } else if (location) {
            loadNearbyShops(location.lat, location.lng);
        }
        setIsLocationModalOpen(false);
    };

    return (
        <>
            {/* MAIN DASHBOARD BODY */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 space-y-8">
                {/* EXCLUSIVE ACCESS WELCOME GREETING */}
                <div>
                    <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-400 block mb-1">
                        EXCLUSIVE ACCESS
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
                        Welcome back, <span className="text-[#F5CA53]">{user?.displayName || "Mr. Adam"}</span>
                    </h1>
                </div>

                {/* MAP / ATELIER LOCATION HERO DISPLAY */}
                <div className="w-full h-80 sm:h-96 rounded-2xl bg-[#0F1014] border border-zinc-800/90 relative overflow-hidden shadow-2xl group">
                    {/* Dark Custom Map View */}
                    {locationInitialized && (
                        <div className="w-full h-full relative z-0">
                            <LocationPicker
                                defaultLocation={location || undefined}
                                onChange={(loc) => {
                                    setLocation(loc);
                                    setSelectedAddress(`Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}`);
                                }}
                            />
                        </div>
                    )}

                    {/* FLOATING CURRENT SELECTION OVERLAY CARD */}
                    <div className="absolute bottom-6 left-6 z-[500] max-w-sm w-full bg-[#121318]/95 border border-zinc-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4">
                        <div>
                            <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-400 block mb-1">
                                CURRENT SELECTION
                            </span>
                            <p className="text-sm font-extrabold text-white leading-tight font-heading">
                                {selectedAddress}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setCustomAddressInput(selectedAddress);
                                setIsLocationModalOpen(true);
                            }}
                            className="px-4 py-2 bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(245,202,83,0.3)] shrink-0 transform hover:scale-105"
                        >
                            CHANGE
                        </button>
                    </div>
                </div>

                {/* NEARBY BEST STORES SECTION */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-[#F5CA53] rounded-full" />
                            <h2 className="text-base font-extrabold text-white tracking-wide font-heading">
                                Nearby Best Stores
                            </h2>
                        </div>
                        <Link href="/tailors" className="text-xs font-mono tracking-widest text-zinc-400 hover:text-[#F5CA53] uppercase transition-colors">
                            View All &rarr;
                        </Link>
                    </div>

                    {/* 3 STORE CARDS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {loadingShops ? (
                            <div className="col-span-3 text-center py-10 font-mono text-xs text-zinc-500 animate-pulse">
                                Discovering nearby bespoke ateliers...
                            </div>
                        ) : nearbyShops.length > 0 ? (
                            nearbyShops
                                .filter((shop) =>
                                    shop.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (shop.city && shop.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                    (shop.specialty && shop.specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                    (shop.shop_bio && shop.shop_bio.toLowerCase().includes(searchQuery.toLowerCase()))
                                )
                                .slice(0, 3)
                                .map((shop) => (
                                    <div key={shop.shop_id} className="bg-[#121318] border border-zinc-800/80 hover:border-[#F5CA53]/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,202,83,0.12)] group">
                                        <div className="flex gap-3">
                                            <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                                                <img
                                                    src={shop.images && shop.images.length > 0 ? shop.images[0].image_url : "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=200&q=80"}
                                                    alt={shop.shop_name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-extrabold text-white group-hover:text-[#F5CA53] transition-colors font-heading">
                                                        {shop.shop_name}
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-[#F5CA53] flex items-center gap-1">
                                                        <span>&#9733;</span> {shop.average_rating ? shop.average_rating.toFixed(1) : "4.9"}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                                    {shop.shop_bio || shop.specialty || "Master tailors specializing in modern silhouettes and sharp architectural cuts."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-3 mt-4 border-t border-zinc-800/80">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-mono text-zinc-500 flex items-center gap-1">
                                                    <span>📍</span> {shop.city}
                                                </span>
                                                <span className="font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                                                    BESPOKE
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => {
                                                        router.push("/tailors");
                                                    }}
                                                    className="w-full py-2 rounded-xl bg-[#18191E] border border-[#F5CA53]/50 hover:bg-[#F5CA53]/10 text-[#F5CA53] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                                                >
                                                    <span>💬 Text</span>
                                                </button>
                                                <Link
                                                    href="/client/request"
                                                    className="w-full text-center py-2 rounded-xl bg-[#F5CA53] text-black text-[11px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(245,202,83,0.2)] hover:scale-[1.01] transition-transform block"
                                                >
                                                    Book &rarr;
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white font-heading">No tailors found nearby</p>
                                    <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                                        Try changing your location or expanding the search radius to discover bespoke ateliers.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsLocationModalOpen(true)}
                                        className="px-4 py-2 bg-[#F5CA53] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(245,202,83,0.2)]"
                                    >
                                        Change Location
                                    </button>
                                    <Link
                                        href="/tailors"
                                        className="px-4 py-2 bg-[#18191E] border border-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-xl hover:border-zinc-600 transition-all"
                                    >
                                        View All Tailors
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* MANUAL LOCATION SELECTION MODAL */}
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
                            <button
                                onClick={() => setIsLocationModalOpen(false)}
                                className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center text-sm transition-all"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Custom Address Input */}
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

                        {/* Popular Preset Quick Chips */}
                        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase block">
                                Popular Atelier Hubs (Quick Pick):
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {LOCATION_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => handleApplyLocation(preset.label, { lat: preset.lat, lng: preset.lng })}
                                        className="px-3 py-2 bg-[#1A1B22] border border-zinc-800 hover:border-[#F5CA53]/60 hover:bg-[#F5CA53]/10 text-zinc-300 hover:text-[#F5CA53] text-xs font-medium rounded-xl transition-all text-left flex items-center gap-1.5"
                                    >
                                        <span>📍</span>
                                        <span>{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Action Footer */}
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