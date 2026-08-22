"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getTailorProfile, updateTailorProfile } from "@/lib/api/endpoints/profiles";
import { listNearbyShops } from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-zinc-900 animate-pulse flex items-center justify-center text-zinc-500 text-sm">Loading map...</div>
});

export default function TailorHomePage() {
    const { user } = useAuth();
    const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);

    // Location Modal State
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [savedLocation, setSavedLocation] = useState<{lat: number, lng: number} | null>(null);
    const [tempLocation, setTempLocation] = useState<{lat: number, lng: number} | null>(null);
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

    const handleSaveLocation = async () => {
        if (!user || !tempLocation) return;
        setIsUpdatingLocation(true);
        try {
            await updateTailorProfile(user.uid, {
                latitude: tempLocation.lat,
                longitude: tempLocation.lng,
                ...(city && { city }),
                ...(address && { address })
            });
            setSavedLocation(tempLocation);
            setShowLocationModal(false);
            // Optionally reload nearby shops if location changed
            loadNearbyShops(tempLocation.lat, tempLocation.lng);
        } catch (error) {
            console.error("Failed to update location", error);
        } finally {
            setIsUpdatingLocation(false);
        }
    };

    const loadNearbyShops = async (lat: number, lng: number) => {
        setLoadingShops(true);
        try {
            const shops = await listNearbyShops({ lat, lng, radius_km: 15 });
            setNearbyShops(shops);
        } catch (error) {
            console.error("Failed to load nearby shops", error);
        } finally {
            setLoadingShops(false);
        }
    };

    useEffect(() => {
        const initLocation = async () => {
            if (user) {
                try {
                    const profile = await getTailorProfile(user.uid);
                    if (profile.latitude && profile.longitude) {
                        const loc = { lat: profile.latitude, lng: profile.longitude };
                        setSavedLocation(loc);
                        setTempLocation(loc);
                        if (profile.city) setCity(profile.city);
                        if (profile.address) setAddress(profile.address);
                        
                        loadNearbyShops(loc.lat, loc.lng);
                        return;
                    }
                } catch (error: any) {
                    if (error?.status !== 404) {
                        console.error("Failed to fetch tailor profile", error);
                    }
                }
            }

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        const loc = { lat: latitude, lng: longitude };
                        setSavedLocation(prev => prev || loc);
                        setTempLocation(prev => prev || loc);
                        loadNearbyShops(latitude, longitude);
                    },
                    (error) => {
                        console.error("Geolocation error:", error);
                        const fallback = { lat: 6.9271, lng: 79.8612 };
                        setSavedLocation(prev => prev || fallback);
                        setTempLocation(prev => prev || fallback);
                        loadNearbyShops(fallback.lat, fallback.lng); // Fallback to Colombo
                    }
                );
            } else {
                const fallback = { lat: 6.9271, lng: 79.8612 };
                setSavedLocation(prev => prev || fallback);
                setTempLocation(prev => prev || fallback);
                loadNearbyShops(fallback.lat, fallback.lng);
            }
        };

        initLocation();
    }, [user]);
    return (
        <main className="min-h-screen bg-[#0D0D0D] text-white pb-24 font-sans selection:bg-yellow-500 selection:text-black">
            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex justify-between items-end">
                <div>
                    <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-1">
                        Welcome Back
                    </p>
                    <h1 className="text-2xl font-semibold">
                        {user?.displayName || "Tailor"},
                    </h1>
                </div>
                <button 
                    onClick={() => setShowLocationModal(true)}
                    className="flex items-center gap-1 bg-[#141414] px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-[#F6CA57] transition-colors"
                >
                    <svg className="w-3 h-3 text-[#F6CA57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[#F6CA57] text-[10px] font-bold tracking-widest uppercase truncate max-w-[120px]">
                        {city || "Change Location"}
                    </span>
                </button>
            </header>

            {/* Dashboard / Order Tracking Card */}
            <section className="px-6 mb-8">
                <div className="bg-[#141414] rounded-3xl p-5 shadow-2xl border border-zinc-800/50 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                            <button className="bg-zinc-800/50 text-[#F6CA57] text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700/50 flex items-center gap-2">
                                Shop 1
                                <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <button className="bg-zinc-800/50 text-[#F6CA57] w-8 h-8 rounded-lg border border-zinc-700/50 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                        <Link href="/tailor/dashboard" className="text-[#F6CA57] text-[10px] font-bold tracking-widest uppercase hover:underline">
                            Dashboard &rarr;
                        </Link>
                    </div>

                    <h2 className="text-lg font-medium mb-4 text-zinc-100">Order Tracking</h2>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-zinc-800/40 rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-700/30">
                            <span className="text-2xl font-bold text-[#F6CA57] mb-1">02</span>
                            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">On Going</span>
                        </div>
                        <div className="bg-zinc-800/40 rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-700/30">
                            <span className="text-2xl font-bold text-zinc-100 mb-1">05</span>
                            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Pending</span>
                        </div>
                        <div className="bg-zinc-800/40 rounded-2xl p-4 flex flex-col items-center justify-center border border-zinc-700/30">
                            <span className="text-2xl font-bold text-zinc-100 mb-1">01</span>
                            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Requests</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs text-zinc-300 font-medium">Three-Piece Suit #2409</span>
                        <span className="text-[#F6CA57] text-xs font-semibold">Fitting</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F6CA57] w-3/4 shadow-[0_0_10px_rgba(246,202,87,0.5)] rounded-full"></div>
                    </div>
                </div>
            </section>

            {/* Nearby Best Stores (Competitive View) */}
            <section className="px-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-zinc-100">Nearby best store</h2>
                    <button className="text-[#F6CA57] text-[10px] font-semibold tracking-wide hover:underline">
                        See all
                    </button>
                </div>

                <div className="space-y-4">
                    {loadingShops ? (
                        <div className="text-zinc-500 text-sm text-center py-8">Loading competitors...</div>
                    ) : nearbyShops.length === 0 ? (
                        <div className="text-zinc-500 text-sm text-center py-8">No competitors found nearby.</div>
                    ) : (
                        nearbyShops.map((shop, index) => (
                            <div key={shop.shop_id} className={`flex gap-4 p-4 rounded-2xl bg-[#141414] shadow-lg border border-zinc-800/50 relative ${index === 0 ? "border-l-2 border-[#F6CA57]" : ""}`}>
                                <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
                                    <img src={shop.images?.[0]?.image_url || "https://images.unsplash.com/photo-1594938298596-70f56fb3cecb?q=80&w=200&auto=format&fit=crop"} className="w-full h-full object-cover" alt={shop.shop_name} />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className="font-semibold text-sm text-zinc-100 mb-1">{shop.shop_name}</h3>
                                    <div className="flex items-center gap-1 mb-1">
                                        <svg className="w-3 h-3 text-[#F6CA57]" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-zinc-300 text-[10px]">{shop.average_rating ? shop.average_rating.toFixed(1) : "New"}</span>
                                    </div>
                                    <p className="text-zinc-500 text-[10px]">
                                        NEARBY • {shop.specialty || "Tailoring Services"}
                                    </p>
                                </div>
                                <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Bottom Navigation */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-sm bg-[#1A1A1A] rounded-full p-2 flex justify-between items-center border border-zinc-800 shadow-2xl z-40">
                <button className="relative w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#EAB308] to-[#FDE047] shadow-[0_0_15px_rgba(234,179,8,0.4)] text-black">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    <span className="absolute -bottom-1 text-[8px] font-bold tracking-wider uppercase text-[#F6CA57]">Home</span>
                </button>
                <button className="w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
                <button className="w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button className="w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </button>
            </div>

            {/* Location Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#141414] w-full max-w-md rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#0D0D0D]">
                            <h3 className="font-semibold text-zinc-100">Update Location</h3>
                            <button onClick={() => setShowLocationModal(false)} className="text-zinc-500 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="w-full relative bg-[#141414] shrink-0 border-b border-zinc-800 mb-6">
                            <LocationPicker 
                                key={savedLocation ? `${savedLocation.lat}-${savedLocation.lng}` : 'default'}
                                defaultLocation={savedLocation || undefined}
                                onChange={(loc: { lat: number; lng: number }) => setTempLocation(loc)} 
                            />
                        </div>
                        
                        <div className="p-4 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">City (Optional)</label>
                                <input 
                                    type="text" 
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="e.g. London, UK"
                                    className="w-full bg-[#0D0D0D] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#F6CA57] transition-colors placeholder:text-zinc-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Address (Optional)</label>
                                <input 
                                    type="text" 
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="e.g. 123 Savile Row"
                                    className="w-full bg-[#0D0D0D] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#F6CA57] transition-colors placeholder:text-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-zinc-800 bg-[#0D0D0D]">
                            <button 
                                onClick={handleSaveLocation}
                                disabled={!tempLocation || isUpdatingLocation}
                                className="w-full bg-[#F6CA57] text-black font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(246,202,87,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isUpdatingLocation ? "SAVING..." : "SAVE LOCATION"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}