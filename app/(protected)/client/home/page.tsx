"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getClientProfile } from "@/lib/api/endpoints/profiles";
import { listNearbyShops } from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-zinc-900 animate-pulse flex items-center justify-center text-zinc-500 text-sm">Loading map...</div>
});

export default function ClientHomePage() {
    const { user, logout } = useAuth();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [locationInitialized, setLocationInitialized] = useState(false);

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
                    // Fall back to browser location or Colombo
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

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* TOP NAVIGATION HEADER */}
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    <Link href="/" className="text-xl sm:text-2xl font-black tracking-widest text-[#F5CA53] hover:opacity-90 transition-opacity">
                        FITI
                    </Link>

                    <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">Storefront</Link>
                        <Link href="/client/home" className="text-[#F5CA53] font-bold relative pb-1 border-b-2 border-[#F5CA53]">My Atelier</Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">Orders</Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">Explore Ateliers</Link>
                    </nav>

                    <div className="flex items-center space-x-5 text-zinc-400">
                        <svg className="w-5 h-5 hover:text-white cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <button
                            onClick={() => logout()}
                            title="Sign out"
                            className="w-8 h-8 rounded-full border border-[#F5CA53]/50 bg-[#F5CA53]/10 flex items-center justify-center text-xs font-bold text-[#F5CA53] hover:bg-[#F5CA53] hover:text-black transition-all"
                        >
                            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "C"}
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN DASHBOARD CONTENT */}
            <main className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-10 flex-1 space-y-10">
                {/* WELCOME BANNER */}
                <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="absolute top-0 right-1/4 w-64 h-32 bg-[#F5CA53]/10 blur-3xl pointer-events-none" />

                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] mb-2 block">
                            CLIENT ATELIER DASHBOARD
                        </span>
                        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Welcome back, <span className="text-[#F5CA53]">{user?.displayName || "Client"}</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-lg leading-relaxed">
                            Track your active bespoke commissions, schedule fittings, and explore Colombo &amp; Kandy&apos;s premier tailors.
                        </p>
                    </div>

                    <Link
                        href="/client/request"
                        className="px-6 py-3.5 rounded-xl bg-[#F5CA53] hover:bg-[#f7d369] text-xs font-black uppercase tracking-[0.15em] text-black shadow-[0_0_20px_rgba(245,202,83,0.25)] transition-all hover:scale-[1.02] shrink-0"
                    >
                        NEW TAILORING REQUEST +
                    </Link>
                </div>

                {/* ACTIVE ORDERS / FITTINGS SECTION */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53]">
                            ACTIVE COMMISSIONS &amp; FITTINGS
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#F5CA53]/10 border border-[#F5CA53]/30 text-[#F5CA53]">
                            1 IN PRODUCTION
                        </span>
                    </div>

                    <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                                    <img
                                        src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=200&q=80"
                                        alt="Double-Breasted Tuxedo"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-white">
                                        Double-Breasted Italian Wool Suit
                                    </h3>
                                    <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                        Atelier Perera &bull; <span className="text-[#F5CA53]">Colombo 07</span> &bull; <span className="text-zinc-500">#ORD-9021</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#F5CA53] block">
                                    NEXT FITTING
                                </span>
                                <span className="text-xs font-bold text-white">
                                    Friday, 3:00 PM
                                </span>
                            </div>
                        </div>

                        {/* FITTING TIMELINE PROGRESS BAR */}
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-zinc-400">Production Stage:</span>
                                <span className="text-[#F5CA53]">Second Fitting Scheduled (75%)</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[#F5CA53] w-3/4 shadow-[0_0_15px_rgba(245,202,83,0.5)] rounded-full" />
                            </div>
                            <div className="grid grid-cols-4 text-[9px] font-black uppercase tracking-wider text-zinc-500 pt-1 text-center">
                                <span className="text-[#F5CA53]">1. Measurements</span>
                                <span className="text-[#F5CA53]">2. Fabric Cut</span>
                                <span className="text-[#F5CA53]">3. Fitting</span>
                                <span>4. Delivery</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ATELIER LOCATOR MAP & NEARBY STORES */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                            NEARBY MASTER TAILORS &amp; ATELIERS
                        </span>
                        <span className="text-xs font-bold text-[#F5CA53] hover:underline cursor-pointer">
                            View All (Colombo &amp; Kandy) &rarr;
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        {/* MAP CARD */}
                        <div className="lg:col-span-6 bg-[#131418]/90 border border-zinc-800/90 rounded-2xl h-80 overflow-hidden relative shadow-2xl">
                            {locationInitialized && (
                                <LocationPicker
                                    defaultLocation={location || undefined}
                                    onChange={(loc) => setLocation(loc)}
                                />
                            )}
                        </div>

                        {/* STORES LIST */}
                        <div className="lg:col-span-6 space-y-4">
                            {loadingShops ? (
                                <div className="text-zinc-500 text-xs text-center py-12">Loading nearby ateliers...</div>
                            ) : nearbyShops.length === 0 ? (
                                <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-2xl p-6 text-center text-xs text-zinc-400">
                                    No ateliers registered in your immediate area. Showing top Colombo ateliers:
                                </div>
                            ) : (
                                nearbyShops.slice(0, 3).map((shop) => (
                                    <div key={shop.shop_id} className="bg-[#131418]/90 border border-zinc-800/90 hover:border-[#F5CA53]/50 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                                                <img
                                                    src={shop.images?.[0]?.image_url || "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=200&q=80"}
                                                    alt={shop.shop_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-extrabold text-white">{shop.shop_name}</h4>
                                                <p className="text-xs text-zinc-400 mt-0.5">{shop.city || "Colombo"} &bull; {shop.specialty || "Bespoke Suits"}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#F5CA53]">
                                            BOOK &rarr;
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* BOTTOM FOOTER */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-8 px-6 sm:px-12 relative z-20 mt-12">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-[#F5CA53]">
                            FITI
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            &copy; {new Date().getFullYear()} FITI Bespoke. All rights reserved.
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}