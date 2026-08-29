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

                <MapWithOverlay
                    onLocationChange={(loc) => loadNearbyShops(loc.lat, loc.lng)}
                />


                {/* NEARBY BEST STORES SECTION */}
                <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-[#F5CA53] rounded-full" />
                            <h2 className="text-base font-extrabold text-white tracking-wide font-heading">
                                Nearby Best Stores
                            </h2>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search tailors, cities..."
                                    className="w-full pl-9 pr-3 py-2 bg-[#121318] border border-zinc-800/80 focus:border-[#F5CA53]/50 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                                />
                            </div>
                            <Link href="/tailors" className="text-xs font-mono tracking-widest text-zinc-400 hover:text-[#F5CA53] uppercase transition-colors shrink-0">
                                View All &rarr;
                            </Link>
                        </div>
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
                                    <div key={shop.shop_id} className="bg-[#121318] border border-zinc-800/60 rounded-[20px] overflow-hidden flex flex-col transition-all duration-300 hover:border-[#F5CA53]/40 hover:shadow-xl hover:shadow-[#F5CA53]/5 group">
                                        {/* Top Image Banner */}
                                        <div className="h-32 w-full bg-zinc-900 relative overflow-hidden shrink-0">
                                            <img
                                                src={shop.images && shop.images.length > 0 ? shop.images[0].image_url : "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80"}
                                                alt={shop.shop_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-zinc-700/50 shadow-lg">
                                                <span className="text-[10px] font-bold text-[#F5CA53] flex items-center gap-1">
                                                    <span>&#9733;</span> {shop.average_rating && shop.average_rating > 0 ? shop.average_rating.toFixed(1) : "New"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="text-base font-extrabold text-white group-hover:text-[#F5CA53] transition-colors font-heading truncate">
                                                {shop.shop_name}
                                            </h3>
                                            <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed flex-1">
                                                {shop.shop_bio || shop.specialty || "Master tailors specializing in modern silhouettes and sharp architectural cuts."}
                                            </p>

                                            <div className="mt-4 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                                                <span className="flex items-center gap-1.5 truncate text-zinc-400">
                                                    <span className="truncate">{shop.city || "Various Locations"}</span>
                                                </span>
                                            </div>

                                            <div className="pt-4 mt-auto">
                                                <Link
                                                    href={`/client/shop/${shop.shop_id}`}
                                                    className="w-full text-center py-2.5 rounded-xl bg-[#1A1B22] border border-zinc-800 text-zinc-300 hover:border-[#F5CA53]/50 text-[11px] font-bold uppercase tracking-wider transition-all block group-hover:bg-[#F5CA53] group-hover:text-black group-hover:border-[#F5CA53]"
                                                >
                                                    View Profile &rarr;
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

        </>
    );
}