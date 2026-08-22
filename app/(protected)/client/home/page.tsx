"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getClientProfile, updateClientProfile } from "@/lib/api/endpoints/profiles";
import { listNearbyShops } from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-zinc-900 animate-pulse flex items-center justify-center text-zinc-500 text-sm">Loading map...</div>
});

export default function ClientHomePage() {
    const { user } = useAuth();
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [saved, setSaved] = useState(false);
    const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [locationInitialized, setLocationInitialized] = useState(false);

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
                    const profile = await getClientProfile(user.uid);
                    if (profile.latitude && profile.longitude) {
                        const savedLoc = { lat: profile.latitude, lng: profile.longitude };
                        setLocation(savedLoc);
                        loadNearbyShops(savedLoc.lat, savedLoc.lng);
                        setLocationInitialized(true);
                        return;
                    }
                } catch (error: any) {
                    if (error?.status !== 404) {
                        console.error("Failed to fetch client profile", error);
                    }
                }
            }

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setLocation(prev => prev || { lat: latitude, lng: longitude });
                        loadNearbyShops(latitude, longitude);
                        setLocationInitialized(true);
                    },
                    (error) => {
                        console.error("Geolocation error:", error);
                        loadNearbyShops(6.9271, 79.8612); // Fallback to Colombo
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

    const handleConfirmLocation = async () => {
        if (!user || !location) return;
        setIsUpdating(true);
        try {
            await updateClientProfile(user.uid, {
                latitude: location.lat,
                longitude: location.lng
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            loadNearbyShops(location.lat, location.lng);
        } catch (error) {
            console.error("Failed to update location", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0D0D0D] text-white pb-24 font-sans selection:bg-yellow-500 selection:text-black">
            {/* Header */}
            <header className="px-6 pt-12 pb-6">
                <p className="text-[#F6CA57] text-xs font-bold tracking-widest uppercase mb-1">
                    Exclusive Access
                </p>
                <h1 className="text-2xl font-light">
                    Welcome back, <span className="font-semibold text-[#F6CA57]">{user?.displayName || "Guest"}</span>
                </h1>
            </header>

            {/* Map Selection Card */}
            <section className="px-6 mb-10">
                <div className="relative w-full h-64 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
                    <div className="absolute inset-0 z-0">
                        {locationInitialized && (
                            <LocationPicker 
                                defaultLocation={location || undefined}
                                onChange={(loc: { lat: number; lng: number }) => setLocation(loc)} 
                            />
                        )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent pointer-events-none z-10"></div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-700 z-20 pointer-events-auto">
                        <div>
                            <p className="text-[#F6CA57] text-[10px] font-bold tracking-wider uppercase mb-1">
                                Current Selection
                            </p>
                            <p className="text-sm font-medium text-zinc-200">
                                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Main Road, Colombo 12"}
                            </p>
                        </div>
                        <button 
                            onClick={handleConfirmLocation}
                            disabled={!location || isUpdating}
                            className="bg-[#F6CA57] text-black text-xs font-bold px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(246,202,87,0.3)] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isUpdating ? "SAVING..." : saved ? "SAVED ✓" : "SAVE LOCATION"}
                        </button>
                    </div>
                </div>
            </section>

            {/* Nearby Best Stores */}
            <section className="px-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-medium">Nearby Best Stores</h2>
                    <div className="flex items-center gap-4">
                        <svg className="w-5 h-5 text-[#F6CA57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <button className="text-[#F6CA57] text-sm font-semibold tracking-wide">
                            View All
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {loadingShops ? (
                        <div className="text-zinc-500 text-sm text-center py-8">Loading nearby stores...</div>
                    ) : nearbyShops.length === 0 ? (
                        <div className="text-zinc-500 text-sm text-center py-8">No stores found nearby.</div>
                    ) : (
                        nearbyShops.map((shop, index) => (
                            <div key={shop.shop_id} className={`flex gap-4 p-4 rounded-2xl bg-[#141414] shadow-lg ${index === 0 ? "border-l-2 border-[#F6CA57]" : ""}`}>
                                <div className="w-20 h-20 rounded-xl bg-zinc-800 overflow-hidden shrink-0 relative">
                                    <img src={shop.images?.[0]?.image_url || "https://images.unsplash.com/photo-1594938298596-70f56fb3cecb?q=80&w=200&auto=format&fit=crop"} className="w-full h-full object-cover" alt={shop.shop_name} />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-zinc-100">{shop.shop_name}</h3>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3 text-[#F6CA57]" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-[#F6CA57] text-xs font-bold">{shop.average_rating ? shop.average_rating.toFixed(1) : "New"}</span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-400 text-xs leading-relaxed mb-3 line-clamp-1">
                                        {shop.specialty || "Tailoring Services"}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-zinc-500 text-[10px]">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span>NEARBY</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Bottom Navigation */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-sm bg-[#1A1A1A] rounded-full p-2 flex justify-between items-center border border-zinc-800 shadow-2xl z-50">
                <button className="relative w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#EAB308] to-[#FDE047] shadow-[0_0_15px_rgba(234,179,8,0.4)] text-black">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    <span className="absolute -bottom-1 text-[8px] font-bold tracking-wider uppercase text-[#F6CA57]">Deals</span>
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
        </main>
    );
}