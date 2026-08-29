"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getClientProfile } from "@/lib/api/endpoints/profiles";
import { listNearbyShops } from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";

import MapWithOverlay from "@/components/map/MapWithOverlay";

export default function ClientHomePage() {
    const { user } = useAuth();
    const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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

    return (
        <>
            {/* MAIN DASHBOARD BODY */}
            <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 space-y-8 bg-warm-beige min-h-screen text-earth-text selection:bg-accent selection:text-cream-bg">
                {/* EXCLUSIVE ACCESS WELCOME GREETING */}
                <div>
                    <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-earth-text/60 block mb-1 font-bold">
                        EXCLUSIVE ACCESS
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-earth-text tracking-tight font-heading">
                        Welcome back, <span className="text-accent">{user?.displayName || "Mr. Adam"}</span>
                    </h1>
                </div>

                <MapWithOverlay
                    onLocationChange={(loc) => loadNearbyShops(loc.lat, loc.lng)}
                />


                {/* NEARBY BEST STORES SECTION */}
                <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-accent rounded-full" />
                            <h2 className="text-base font-extrabold text-earth-text tracking-wide font-heading">
                                Nearby Best Stores
                            </h2>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-earth-text/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search tailors, cities..."
                                    className="w-full pl-9 pr-3 py-2 bg-cream-bg border border-accent/20 focus:border-accent/50 rounded-xl text-xs text-earth-text placeholder-earth-text/50 focus:outline-none transition-all shadow-sm"
                                />
                            </div>
                            <Link href="/client/tailors" className="text-xs font-mono tracking-widest text-earth-text/70 hover:text-accent uppercase transition-colors shrink-0 font-bold">
                                View All &rarr;
                            </Link>
                        </div>
                    </div>

                    {/* 3 STORE CARDS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {loadingShops ? (
                            <div className="col-span-3 text-center py-10 font-mono text-xs text-earth-text/50 animate-pulse font-bold">
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
                                    <div key={shop.shop_id} className="bg-cream-bg border border-accent/20 rounded-[20px] overflow-hidden flex flex-col transition-all duration-300 hover:border-accent/40 hover:shadow-xl group">
                                        {/* Top Image Banner */}
                                        <div className="h-32 w-full bg-warm-beige relative overflow-hidden shrink-0">
                                            <img
                                                src={shop.images && shop.images.length > 0 ? shop.images[0].image_url : "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80"}
                                                alt={shop.shop_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute top-3 right-3 bg-cream-bg/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-accent/20 shadow-md">
                                                <span className="text-[10px] font-bold text-accent flex items-center gap-1">
                                                    <span>&#9733;</span> {shop.average_rating && shop.average_rating > 0 ? shop.average_rating.toFixed(1) : "New"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="text-base font-extrabold text-earth-text group-hover:text-accent transition-colors font-heading truncate">
                                                {shop.shop_name}
                                            </h3>
                                            <p className="text-[11px] text-earth-text/70 mt-1.5 line-clamp-2 leading-relaxed flex-1 font-medium">
                                                {shop.shop_bio || shop.specialty || "Master tailors specializing in modern silhouettes and sharp architectural cuts."}
                                            </p>

                                            <div className="mt-4 pt-4 border-t border-accent/10 flex items-center justify-between text-[10px] font-mono text-earth-text/60 font-bold">
                                                <span className="flex items-center gap-1.5 truncate">
                                                    <span className="truncate">{shop.city || "Various Locations"}</span>
                                                </span>
                                            </div>

                                            <div className="pt-4 mt-auto">
                                                <Link
                                                    href={`/client/shop/${shop.shop_id}`}
                                                    className="w-full text-center py-2.5 rounded-xl bg-warm-beige border border-accent/20 text-earth-text/80 hover:border-accent/50 text-[11px] font-bold uppercase tracking-wider transition-all block group-hover:bg-accent group-hover:text-cream-bg group-hover:border-accent shadow-sm"
                                                >
                                                    View Profile
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center space-y-4 bg-cream-bg border border-accent/20 rounded-[20px] shadow-sm">
                                <div className="w-14 h-14 rounded-full bg-warm-beige border border-accent/20 flex items-center justify-center text-accent mx-auto">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-earth-text font-heading">No tailors found nearby</p>
                                    <p className="text-xs text-earth-text/70 mt-1 max-w-xs font-medium">
                                        Try changing your location or expanding the search radius to discover bespoke ateliers.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Link
                                        href="/client/tailors"
                                        className="px-5 py-2.5 bg-accent text-cream-bg text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md"
                                    >
                                        View All Tailors
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

        </>
    );
}